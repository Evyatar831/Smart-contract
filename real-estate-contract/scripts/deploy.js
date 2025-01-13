async function main() {
  const RealEstateContract = await ethers.getContractFactory("RealEstateContract");
  const realEstate = await RealEstateContract.deploy();
  await realEstate.deployed();
  console.log("RealEstateContract deployed to:", realEstate.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});