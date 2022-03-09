import { ethers, providers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { Button, Card, Form, Input, message, Row, Spin } from 'antd';
import { AccountContext } from '../context/AccountContext';
import { Signer } from '../utils/getSigner';
import { Contract } from '../utils/useContract';
import { Allowance } from '../utils/getAllowance';
import { isvalidSubstrateAddress } from '../utils/checkAddress';
import { ErrorHandling } from '../utils/errorHandling';
import usdt from '../assets/usdt.png';
import down from '../assets/icons/down.svg';
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";

export default function Buy() {
  const { isTrust } = useContext(AccountContext);
  const [spinning, setSpinning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [allowance, setAllowance] = useState('');
  const tokenAddress = '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd';
  async function approve() {
    try {
      const contractAddress = '0x1ea5d1c9434B89B03C4aAC95dd4C56cD86430385';
      let abi = ['function approve(address _spender, uint256 _value) public returns (bool success)'];

      setLoading(true);
      const signer = await Signer(isTrust);
      const contract = new ethers.Contract(tokenAddress, abi, signer);
      const data = await contract.approve(
        contractAddress,
        ethers.utils.parseUnits(Math.pow(10, 18).toString(), 18)
      );
      await data.wait();
      setAllowance(data.hash);
      setLoading(false);
      message.success('Approve completed!');
    } catch (error) {
      ErrorHandling(error);
      setLoading(false);
    }
  }
  
  async function handleOrder() {
    try {
      if(!amount || !address) return message.error('Please fill the form');
      if(!isvalidSubstrateAddress(address)) return message.error('selendra address is not valid!');
      setLoading(true);

      const provider = new providers.Web3Provider(window.ethereum);
      const contract = await Contract(isTrust); 
      
      const data = await contract.order(
        address,
        ethers.utils.parseUnits(amount, 18)
      );
      await data.wait();
      const result = await provider.getTransactionReceipt(data.hash);
      console.log(result);
      if(result.status === 1) {
        const ws = new WsProvider('wss://rpc1-testnet.selendra.org');
        const api = await ApiPromise.create({ provider: ws });
      
        const keyring = new Keyring({ 
          type: 'sr25519',
          ss58Format: 972
        });
        // paste mnemonic here
        const account = keyring.addFromMnemonic(process.env.REACT_APP_MNEMONIC);

        // eslint-disable-next-line no-undef
        const parsedAmount = BigInt(amount * Math.pow(10, 18));
        const nonce = await api.rpc.system.accountNextIndex(account.address);
      
        const transfer = await api.tx.balances
          .transfer(address, parsedAmount)
          .signAndSend(account, {nonce});
        console.log(`Transfer sent to ${address} with hash ${transfer.toHex()}`, '\n');
      }
      setLoading(false);
      message.success('Transaction completed!');
    } catch (error) {
      ErrorHandling(error);
      setLoading(false);
    }
  }

  function estimateSEL(amount) {
    setTimeout(() => {
      setSpinning(false);
    }, 1000);
    return (amount / 0.03).toFixed(2);
  }

  useEffect(() => {
    async function checkAllowance() {
      try {
        setLoading(true);
        const allowance = await Allowance(isTrust, tokenAddress);
        setAllowance(Number(allowance._hex));
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    }
    checkAllowance();
  },[isTrust, allowance])

  return (
    <div 
      style={{
        maxWidth: '720px',
        margin: '0 auto'
      }}
    >
      <Card style={{borderRadius: '8px', padding: '24px'}}>
        <center className='buy__title'>
          <h2>Selendra Native Token Sale</h2>
          <p>Selendra community auction program is open for anyone to buy SEL token up to USD 100.00 and limited time bound.</p>
        </center>
        <Form layout='vertical'>
          <Form.Item label='Amount'>
            <Input 
              className='buy__input' 
              placeholder='Enter Amount' 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              suffix={(
                <div>
                <img src={usdt} alt='' width={22} height={22} />
                <span style={{color: '#3D525C', marginLeft: '8px'}}>USDT</span>
                </div>
              )}  
            />
          </Form.Item>
          <Form.Item label='Selendra Address'>
            <Input 
              className='buy__input'
              placeholder='Enter Selendra Address' 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
            />
          </Form.Item>
          { amount &&
            <div>
              <center style={{marginBottom: '20px'}}>
                <img src={down} width={22} height={22} alt='' />
              </center>
              <Spin spinning={spinning} delay={500}>
                <Form.Item label='To (estimated)'>
                  <Input className='buy__input' value={estimateSEL(amount)} readOnly placeholder='' />
                </Form.Item>
              </Spin>
            </div>
          }
          <Form.Item>
            { allowance ?
              <Button className='buy__button' loading={loading} onClick={handleOrder}>Contribute</Button>
              :
              <Button className='buy__button' loading={loading} onClick={approve}>Approve USDT</Button>
            }
          </Form.Item>
        </Form>
        <div className=''>
          <h2>How it works?</h2>
          <p>
            A simple method for participation to participate in token sale. Please follow the steps below: <br />
            1.Make sure you have Selendra address. Currently, you can set up account and get your address via <a href='https://app.selendra.org/#/accounts' target='_blank' rel="noreferrer">Selendra App</a> <br />
            2. Connect to Metamask or Trust Wallet. <br />
            3. Change network to BSC, if don't have BSC yet:
            <a href='https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain' target='_blank' rel="noreferrer"> Metamask</a>,
            <a href='https://academy.binance.com/en/articles/connecting-trust-wallet-to-binance-smart-chain-bsc' target='_blank' rel="noreferrer"> Trust wallet</a>. <br />
            4. Make sure you have fund available at least $10 worth of USDT stable coins. <br />
            5. Enter the contribution amount. <br />
            6. Press Contribute.
          </p>
        </div>
      </Card>  
    </div>
  )
}
