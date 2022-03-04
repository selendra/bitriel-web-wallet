import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers, providers } from "ethers";

export async function Allowance(isTrust, tokenAddress) {
  let signer;
  let accounts;
  const contractAddress = '0x1ea5d1c9434B89B03C4aAC95dd4C56cD86430385';
  let abi = ["function allowance(address _owner, address _spender) public view returns (uint256)"];

  if(isTrust) {
    const provider = new WalletConnectProvider({
      rpc: {
        56: "https://bsc-dataseed.binance.org"
      },
    });
  
    await provider.enable();
  
    const web3Provider = new providers.Web3Provider(provider);
    accounts = await web3Provider.listAccounts();
    signer = web3Provider.getSigner();
  } else {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    accounts = await provider.listAccounts();
    signer = provider.getSigner(accounts[0]);
  }
  
  const contract = new ethers.Contract(tokenAddress, abi, signer);
  const allowance = await contract.allowance(accounts[0], contractAddress);

  return allowance;
}