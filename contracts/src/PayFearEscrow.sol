// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PayFearEscrow
 * @notice Minimal escrow for PayFear task marketplace.
 *         Requester deposits ETH → backend releases to executor or refunds to requester.
 *         All business logic (proof, dispute, review) lives off-chain.
 *
 * @dev    "Keep smart contract simple. Complexity stays off-chain."
 */
contract PayFearEscrow {
    // ───────────────────── Types ─────────────────────

    enum Status {
        EMPTY,
        FUNDED,
        RELEASED,
        REFUNDED
    }

    struct Escrow {
        address requester; // depositor
        address executor; // recipient (set on fund or release)
        uint256 amount; // escrowed ETH (excluding fee)
        uint256 platformFee; // fee held for platform
        Status status;
    }

    // ───────────────────── State ─────────────────────

    address public owner; // backend relayer
    address public feeCollector; // receives platform fees
    uint256 public feeBps; // fee in basis points (500 = 5%)

    mapping(bytes32 => Escrow) public escrows; // taskId → Escrow

    uint256 public totalEscrowed;
    uint256 public totalReleased;

    // ───────────────────── Events ────────────────────

    event Funded(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 amount,
        uint256 fee
    );
    event Released(
        bytes32 indexed taskId,
        address indexed executor,
        uint256 amount
    );
    event Refunded(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 amount
    );
    event FeeCollected(bytes32 indexed taskId, uint256 fee);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event FeeCollectorChanged(
        address indexed oldCollector,
        address indexed newCollector
    );
    event FeeBpsChanged(uint256 oldBps, uint256 newBps);

    // ───────────────────── Errors ────────────────────

    error OnlyOwner();
    error AlreadyFunded();
    error NotFunded();
    error ZeroAmount();
    error ZeroAddress();
    error TransferFailed();
    error FeeTooHigh();

    // ───────────────────── Modifiers ─────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ───────────────────── Constructor ────────────────

    /**
     * @param _feeCollector  Address that collects platform fees.
     * @param _feeBps        Platform fee in basis points (e.g. 500 = 5%).
     */
    constructor(address _feeCollector, uint256 _feeBps) {
        if (_feeCollector == address(0)) revert ZeroAddress();
        if (_feeBps > 1000) revert FeeTooHigh(); // max 10%

        owner = msg.sender;
        feeCollector = _feeCollector;
        feeBps = _feeBps;
    }

    // ───────────────────── Core ──────────────────────

    /**
     * @notice Requester deposits ETH for a task.
     * @param taskId  Off-chain task identifier (hashed to bytes32).
     */
    function fund(bytes32 taskId) external payable {
        if (msg.value == 0) revert ZeroAmount();
        if (escrows[taskId].status != Status.EMPTY) revert AlreadyFunded();

        uint256 fee = (msg.value * feeBps) / 10_000;
        uint256 net = msg.value - fee;

        escrows[taskId] = Escrow({
            requester: msg.sender,
            executor: address(0),
            amount: net,
            platformFee: fee,
            status: Status.FUNDED
        });

        totalEscrowed += net;

        emit Funded(taskId, msg.sender, net, fee);
    }

    /**
     * @notice Release escrowed funds to executor. Only callable by owner (backend relayer).
     * @param taskId   The task to release.
     * @param executor The executor to pay.
     */
    function release(bytes32 taskId, address executor) external onlyOwner {
        Escrow storage e = escrows[taskId];
        if (e.status != Status.FUNDED) revert NotFunded();
        if (executor == address(0)) revert ZeroAddress();

        e.executor = executor;
        e.status = Status.RELEASED;

        uint256 payout = e.amount;
        uint256 fee = e.platformFee;

        totalEscrowed -= payout;
        totalReleased += payout;

        // Pay executor
        (bool ok1, ) = executor.call{value: payout}("");
        if (!ok1) revert TransferFailed();

        // Collect fee
        if (fee > 0) {
            (bool ok2, ) = feeCollector.call{value: fee}("");
            if (!ok2) revert TransferFailed();
            emit FeeCollected(taskId, fee);
        }

        emit Released(taskId, executor, payout);
    }

    /**
     * @notice Refund escrowed funds to requester. Only callable by owner (backend relayer).
     * @param taskId The task to refund.
     */
    function refund(bytes32 taskId) external onlyOwner {
        Escrow storage e = escrows[taskId];
        if (e.status != Status.FUNDED) revert NotFunded();

        e.status = Status.REFUNDED;

        uint256 total = e.amount + e.platformFee; // refund includes fee
        totalEscrowed -= e.amount;

        (bool ok, ) = e.requester.call{value: total}("");
        if (!ok) revert TransferFailed();

        emit Refunded(taskId, e.requester, total);
    }

    // ───────────────────── Views ─────────────────────

    function getEscrow(bytes32 taskId) external view returns (Escrow memory) {
        return escrows[taskId];
    }

    function getStatus(bytes32 taskId) external view returns (Status) {
        return escrows[taskId].status;
    }

    // ───────────────────── Admin ─────────────────────

    function setOwner(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert ZeroAddress();
        emit FeeCollectorChanged(feeCollector, newCollector);
        feeCollector = newCollector;
    }

    function setFeeBps(uint256 newBps) external onlyOwner {
        if (newBps > 1000) revert FeeTooHigh();
        emit FeeBpsChanged(feeBps, newBps);
        feeBps = newBps;
    }
}
