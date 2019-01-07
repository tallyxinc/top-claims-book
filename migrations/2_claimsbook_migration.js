var Migrations = artifacts.require("./ClaimsBook.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
