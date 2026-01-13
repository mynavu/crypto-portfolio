import { useAccount, useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'
import axios from 'axios'
import Plasma from './Plasma.tsx';

function App() {
  const connection = useConnection()
  const { connect, status, error } = useConnect()
  const connectors = useConnectors()
  const { disconnect } = useDisconnect()
  const { address } = useAccount();

  type Token = {
    address: string
    symbol: string | null
    decimals: number | null
    logo: string | null
    balance: string
  }


  const [balances, setBalances] = useState<Token[]>([])

  useEffect(() => {
    if (connection.status === 'connected' && address) {
      const fetchBalances = async () => {
        try {
          const response = await axios.get('http://localhost:8000/portfolio', {
            params: { address, chainId: connection.chainId,},
          })
          setBalances(response.data.tokens)
          console.log('Fetched balances:', response.data.tokens)
        } catch (error) {
          console.error('Error fetching token balances:', error)
        }
      }

      fetchBalances();

    }
  }, [connection.status, address])
      
  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
          {/* BACKGROUND */}
          <div className="absolute inset-0 -z-10">
          <Plasma 
            color="#3a3e63"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={false}
          />
        </div>
        <div className="
          relative
          z-10
          mx-auto
          mt-24
          max-w-xl
          rounded-2xl
          border border-white/20
          bg-white/10
          backdrop-blur-xl
          shadow-2xl
          p-6
        ">

          <h2 className='text-2xl font-bold'>Connection</h2>

          <div>
            status: {connection.status}
          </div>

          {connection.status === 'connected' && (
            <>
            addresses: {JSON.stringify(connection.addresses)}
            <br />
            chainId: {connection.chainId}
            <br />
              <button className='m-2 p-2 border rounded-lg bg-white/20 hover:bg-white/30 transition cursor-pointer' type="button" onClick={() => disconnect()}>
                Disconnect
              </button>
              {balances.length > 0 && (
                <div>
                  <h2 className='font-bold'>Token Balances</h2>
                  <ul>
                    {balances.map((token) => (
                      <li key={token.address}>
                        {token.logo && (
                          <img
                            src={token.logo}
                            alt={token.symbol ?? 'token logo'}
                            width={20}
                            height={20}
                          />
                        )}{' '}
                        {token.symbol}: {token.balance}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        

          <div>
            <h2>Connect</h2>
            {connectors.map((connector) => (
              <button className='m-2 p-2 border rounded-lg bg-white/20 hover:bg-white/30 transition cursor-pointer'
                key={connector.uid}
                onClick={() => connect({ connector })}
                type="button"
              >
                {connector.name}
              </button>
            ))}
            <div>wallet connection: {status}</div>
            <div>{error?.message}</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
