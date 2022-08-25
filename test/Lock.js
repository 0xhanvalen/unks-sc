const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployUnks() {
    // Contracts are deployed using the first signer/account by default
    const [owner, minter] = await ethers.getSigners();

    const Unks = await ethers.getContractFactory("UNKS");
    const unks = await Unks.deploy();
    await ethers.provider.send("evm_setNextBlockTimestamp", [1661608800]);
    await ethers.provider.send("evm_mine");

    return { unks, owner, minter, };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { unks, owner } = await loadFixture(deployUnks);

      expect(await unks.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow public mint during public mint period", async function () {
      const { unks, owner } = await loadFixture(deployUnks);
      await ethers.provider.send("evm_setNextBlockTimestamp", [1661695200]);
      await ethers.provider.send("evm_mine");
      expect(await unks.publicMint(4, {value: ethers.utils.parseEther("0.12")})).to.not.be.reverted;
      expect(await unks.balanceOf(owner.address)).to.equal(4);
      await expect(unks.publicMint(4, {value: ethers.utils.parseEther("0.12")})).to.be.revertedWith("Too Many Unks");
    });
    
    it("Should allow team mint", async function () { 
      const {unks, owner} = await loadFixture(deployUnks);
      expect(await unks.connect(owner).teamMint()).to.not.be.reverted;
      expect(await unks.balanceOf(owner.address)).to.equal(160);
      expect(await unks.teamMint()).to.be.revertedWith("Already Minted");
    });
    
    it("Should block too many mints", async function () {
      const {unks, owner} = await loadFixture(deployUnks);
      expect(await unks.connect(owner).teamMint()).to.not.be.reverted;
      await ethers.provider.send("evm_setNextBlockTimestamp", [1661695200]);
      await ethers.provider.send("evm_mine");
      await expect(unks.publicMint(4, {value: ethers.utils.parseEther("0.12")})).to.be.revertedWith("Minting beyond scope");
      await expect(unks.publicMint(3, {value: ethers.utils.parseEther("0.09")})).to.not.be.reverted;
    });

  });

  describe("Withdrawals", function () {});
});
