// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PayFearEscrow.sol";

contract PayFearEscrowTest is Test {

    PayFearEscrow escrow;

    address owner     = address(this);
    address requester = makeAddr("requester");
    address executor  = makeAddr("executor");
    address feeColl   = makeAddr("feeCollector");
    address attacker  = makeAddr("attacker");

    bytes32 taskId  = keccak256("task_001");
    bytes32 taskId2 = keccak256("task_002");

    uint256 constant FEE_BPS = 500; // 5%

    function setUp() public {
        escrow = new PayFearEscrow(feeColl, FEE_BPS);
        vm.deal(requester, 100 ether);
        vm.deal(attacker, 10 ether);
    }

    // ─── Deployment ──────────────────────────────

    function test_deployment_sets_owner() public view {
        assertEq(escrow.owner(), owner);
    }

    function test_deployment_sets_feeCollector() public view {
        assertEq(escrow.feeCollector(), feeColl);
    }

    function test_deployment_sets_feeBps() public view {
        assertEq(escrow.feeBps(), FEE_BPS);
    }

    function test_deploy_reverts_zero_feeCollector() public {
        vm.expectRevert(PayFearEscrow.ZeroAddress.selector);
        new PayFearEscrow(address(0), FEE_BPS);
    }

    function test_deploy_reverts_fee_too_high() public {
        vm.expectRevert(PayFearEscrow.FeeTooHigh.selector);
        new PayFearEscrow(feeColl, 1001);
    }

    // ─── Fund ────────────────────────────────────

    function test_fund_creates_escrow() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        PayFearEscrow.Escrow memory e = escrow.getEscrow(taskId);
        assertEq(e.requester, requester);
        assertEq(e.executor, address(0));
        assertEq(e.amount, 0.95 ether);        // 1 - 5%
        assertEq(e.platformFee, 0.05 ether);    // 5%
        assertEq(uint8(e.status), 1);           // FUNDED
    }

    function test_fund_emits_Funded() public {
        vm.prank(requester);
        vm.expectEmit(true, true, false, true);
        emit PayFearEscrow.Funded(taskId, requester, 0.95 ether, 0.05 ether);
        escrow.fund{value: 1 ether}(taskId);
    }

    function test_fund_updates_totalEscrowed() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);
        assertEq(escrow.totalEscrowed(), 0.95 ether);
    }

    function test_fund_reverts_zero_value() public {
        vm.prank(requester);
        vm.expectRevert(PayFearEscrow.ZeroAmount.selector);
        escrow.fund{value: 0}(taskId);
    }

    function test_fund_reverts_already_funded() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        vm.prank(requester);
        vm.expectRevert(PayFearEscrow.AlreadyFunded.selector);
        escrow.fund{value: 1 ether}(taskId);
    }

    // ─── Release ─────────────────────────────────

    function test_release_pays_executor_and_fee() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        uint256 execBefore = executor.balance;
        uint256 feeBefore  = feeColl.balance;

        escrow.release(taskId, executor);

        assertEq(executor.balance - execBefore, 0.95 ether);
        assertEq(feeColl.balance - feeBefore, 0.05 ether);
    }

    function test_release_emits_Released_and_FeeCollected() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        // FeeCollected fires before Released in the contract
        vm.expectEmit(true, false, false, true);
        emit PayFearEscrow.FeeCollected(taskId, 0.05 ether);
        vm.expectEmit(true, true, false, true);
        emit PayFearEscrow.Released(taskId, executor, 0.95 ether);

        escrow.release(taskId, executor);
    }

    function test_release_sets_status_RELEASED() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);
        escrow.release(taskId, executor);

        assertEq(uint8(escrow.getStatus(taskId)), 2); // RELEASED
    }

    function test_release_updates_counters() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);
        escrow.release(taskId, executor);

        assertEq(escrow.totalEscrowed(), 0);
        assertEq(escrow.totalReleased(), 0.95 ether);
    }

    function test_release_reverts_not_funded() public {
        vm.expectRevert(PayFearEscrow.NotFunded.selector);
        escrow.release(taskId, executor);
    }

    function test_release_reverts_zero_executor() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        vm.expectRevert(PayFearEscrow.ZeroAddress.selector);
        escrow.release(taskId, address(0));
    }

    function test_release_reverts_not_owner() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        vm.prank(attacker);
        vm.expectRevert(PayFearEscrow.OnlyOwner.selector);
        escrow.release(taskId, executor);
    }

    function test_release_reverts_double_release() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);
        escrow.release(taskId, executor);

        vm.expectRevert(PayFearEscrow.NotFunded.selector);
        escrow.release(taskId, executor);
    }

    // ─── Refund ──────────────────────────────────

    function test_refund_returns_full_amount() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        uint256 before = requester.balance;
        escrow.refund(taskId);

        assertEq(requester.balance - before, 1 ether); // full refund includes fee
    }

    function test_refund_emits_Refunded() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        vm.expectEmit(true, true, false, true);
        emit PayFearEscrow.Refunded(taskId, requester, 1 ether);
        escrow.refund(taskId);
    }

    function test_refund_sets_status_REFUNDED() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);
        escrow.refund(taskId);

        assertEq(uint8(escrow.getStatus(taskId)), 3); // REFUNDED
    }

    function test_refund_reverts_not_funded() public {
        vm.expectRevert(PayFearEscrow.NotFunded.selector);
        escrow.refund(taskId);
    }

    function test_refund_reverts_not_owner() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);

        vm.prank(attacker);
        vm.expectRevert(PayFearEscrow.OnlyOwner.selector);
        escrow.refund(taskId);
    }

    function test_refund_reverts_double_refund() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);
        escrow.refund(taskId);

        vm.expectRevert(PayFearEscrow.NotFunded.selector);
        escrow.refund(taskId);
    }

    // ─── Multiple Tasks ──────────────────────────

    function test_multiple_escrows_independent() public {
        vm.prank(requester);
        escrow.fund{value: 1 ether}(taskId);
        vm.prank(requester);
        escrow.fund{value: 2 ether}(taskId2);

        assertEq(escrow.totalEscrowed(), 2.85 ether); // 0.95 + 1.90

        escrow.release(taskId, executor);
        escrow.refund(taskId2);

        assertEq(escrow.totalEscrowed(), 0);
        assertEq(escrow.totalReleased(), 0.95 ether);
    }

    // ─── Admin ───────────────────────────────────

    function test_setOwner() public {
        escrow.setOwner(attacker);
        assertEq(escrow.owner(), attacker);
    }

    function test_setFeeCollector() public {
        escrow.setFeeCollector(attacker);
        assertEq(escrow.feeCollector(), attacker);
    }

    function test_setFeeBps() public {
        escrow.setFeeBps(300);
        assertEq(escrow.feeBps(), 300);
    }

    function test_setFeeBps_reverts_too_high() public {
        vm.expectRevert(PayFearEscrow.FeeTooHigh.selector);
        escrow.setFeeBps(1001);
    }

    function test_admin_reverts_not_owner() public {
        vm.prank(attacker);
        vm.expectRevert(PayFearEscrow.OnlyOwner.selector);
        escrow.setOwner(attacker);
    }

    // ─── Edge Cases ──────────────────────────────

    function test_minimum_deposit_1_wei() public {
        vm.prank(requester);
        escrow.fund{value: 1}(taskId);

        PayFearEscrow.Escrow memory e = escrow.getEscrow(taskId);
        assertEq(e.amount, 1);       // net = 1 (fee rounds to 0)
        assertEq(e.platformFee, 0);
    }

    function test_zero_fee_escrow() public {
        PayFearEscrow zeroFee = new PayFearEscrow(feeColl, 0);
        vm.prank(requester);
        zeroFee.fund{value: 1 ether}(taskId);

        PayFearEscrow.Escrow memory e = zeroFee.getEscrow(taskId);
        assertEq(e.amount, 1 ether);
        assertEq(e.platformFee, 0);
    }

    // ─── Fuzz ────────────────────────────────────

    function testFuzz_fund_fee_calculation(uint256 amount) public {
        amount = bound(amount, 1, 10 ether);

        vm.prank(requester);
        escrow.fund{value: amount}(taskId);

        PayFearEscrow.Escrow memory e = escrow.getEscrow(taskId);
        uint256 expectedFee = (amount * FEE_BPS) / 10_000;
        uint256 expectedNet = amount - expectedFee;

        assertEq(e.platformFee, expectedFee);
        assertEq(e.amount, expectedNet);
        assertEq(e.amount + e.platformFee, amount);
    }
}
