// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PayFearEscrow.sol";

contract DeployPayFearEscrow is Script {
    function run() external {
        // Read config from env
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address feeCollector = vm.envOr("FEE_COLLECTOR", vm.addr(deployerKey));
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(500)); // default 5%

        vm.startBroadcast(deployerKey);

        PayFearEscrow escrow = new PayFearEscrow(feeCollector, feeBps);

        vm.stopBroadcast();

        console.log(unicode"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(unicode"✅ PayFearEscrow deployed!");
        console.log("  Address:       ", address(escrow));
        console.log("  Fee Collector: ", feeCollector);
        console.log("  Fee BPS:       ", feeBps);
        console.log("  Owner:         ", escrow.owner());
        console.log(unicode"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
}
