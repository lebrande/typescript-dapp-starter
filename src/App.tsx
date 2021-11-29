import { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json';
import Token from './artifacts/contracts/Token.sol/Token.json';

const GREETER_ADDRESS = process.env.REACT_APP_FRONT_GREETER_ADDRESS!;
const TOKEN_ADDRESS = process.env.REACT_APP_FRONT_TOKEN_ADDRESS!;

interface RequestPayload {
  method: 'eth_requestAccounts';
}

interface WindowEthereum {
  request: (payload: RequestPayload) => void;
}

export type WindowInstanceWithEthereum = Window &
  typeof globalThis & { ethereum?: WindowEthereum };

const w = window as WindowInstanceWithEthereum;

function App() {
  const [greeting, setGreeting] = useState<string>();
  const [userAccount, setUserAccount] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const requestAccount = async () => {
    await w.ethereum?.request({ method: 'eth_requestAccounts' });
  }

  const fetchGreeting = async () => {
    if (typeof w.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(w.ethereum as any);
      const contract = new ethers.Contract(
        GREETER_ADDRESS,
        Greeter.abi,
        provider,
      );

      try {
        const data = await contract.greet();
        console.log({ data });
      } catch (error) {
        console.log({ error });
      }
    }
  }

  const getBalance = async () => {
    if (typeof w.ethereum !== 'undefined') {
      const [account] = (await w.ethereum?.request({ method: 'eth_requestAccounts' })) as unknown as [string];
      const provider = new ethers.providers.Web3Provider(w.ethereum as any);
      const contract = new ethers.Contract(
        TOKEN_ADDRESS,
        Token.abi,
        provider,
      );
      const balance = await contract.balanceOf(account) as ethers.BigNumber;
      console.log('Balance: ', balance.toString())
    }
  }

  const sendCoins = async () => {
    if (typeof w.ethereum !== 'undefined') {
      await w.ethereum?.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(w.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        TOKEN_ADDRESS,
        Token.abi,
        signer,
      );
      const transaction = await contract.transfer(userAccount, amount);
      await transaction.wait();
      console.log(`${amount} Coins successfully sent to ${userAccount}`)
    }
  }

  const updateGreeting = async () => {
    if (!greeting) return;
    if (typeof w.ethereum !== 'undefined') {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(w.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        GREETER_ADDRESS,
        Greeter.abi,
        signer,
      );
      const transaction = await contract.setGreeting(greeting);
      setGreeting('');
      await transaction.wait();
      fetchGreeting();
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={fetchGreeting}>
          Fetch Greeting
        </button>
        <button onClick={updateGreeting}>
          Set Greeting
        </button>
        <input
          type="text"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder="Set Greeting"
        />

        <br />

        <button onClick={getBalance}>Get Balance</button>
        <button onClick={sendCoins}>Send Coins</button>
        <input
          type="text"
          value={userAccount}
          onChange={(e) => setUserAccount(e.target.value)}
          placeholder="Account Address"
        />
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(+e.target.value)}
          placeholder="Amount"
        />
      </header>
    </div>
  );
}

export default App;
