import { useAccount, useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'
import axios from 'axios'


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
      <div className='flex flex-col gap-4 p-3'>
        <h2 className='text-2xl font-bold'>Connection</h2>

        <div>
          status: {connection.status}
          <br />
          addresses: {JSON.stringify(connection.addresses)}
          <br />
          chainId: {connection.chainId}
        </div>

        {connection.status === 'connected' && (
          <>
            <button type="button" onClick={() => disconnect()}>
              Disconnect
            </button>
            {balances.length > 0 && (
              <div>
                <h2>Token Balances</h2>
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
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
    </>
  )
}

export default App
