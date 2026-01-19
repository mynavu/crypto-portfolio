import { useAccount, useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
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
const [loading, setLoading] = useState(false)
const [fetchError, setFetchError] = useState<string | null>(null)

useEffect(() => {
  if (connection.status === 'connected' && address) {
    const fetchBalances = async (): Promise<void> => {
      setLoading(true)
      setFetchError(null)
      try {
        console.log('Fetching for address:', address, 'chainId:', connection.chainId)
        
        const response = await axios.get('/api/portfolio', {
          params: { address, chainId: connection.chainId },
        })
        setBalances(response.data.tokens)
        console.log('Fetched balances:', response.data.tokens)
      } catch (error) {
        console.error('Error fetching token balances:', error)
        setFetchError('Failed to fetch balances')
      } finally {
        setLoading(false)
      }
    }

    fetchBalances();
  } else {
    setBalances([])
  }
}, [connection.status, address, connection.chainId])
      
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
<div
  className={`
    relative
    z-10
    mx-auto
    mt-24
    max-w-xl
    rounded-2xl
    bg-white/10
    backdrop-blur-xl
    shadow-2xl
    p-6
    border
    transition-all
    duration-300
    ${
      connection.status === 'connected'
        ? 'border-white shadow-[0_0_30px_rgba(209,209,209,0.6)]'
        : 'border-white/20'
    }
  `}
>


          <h2 className='text-2xl font-bold'>{connection.status === 'connected' ? 'Portfolio' : 'Connection'}</h2>

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
    
              {loading && <div className="text-white/70">Loading balances...</div>}
              {fetchError && <div className="text-red-400">{fetchError}</div>}
    
              {!loading && balances.length === 0 && !fetchError && (
                <div className="text-white/70">No tokens found on this network</div>
              )}
    
              {balances.length > 0 && (
                <div>
                  <h2 className='font-bold'>Token Balances</h2>
                  <ul>
                    {balances.map((token) => (
                      <li key={token.address} className="flex items-center gap-2 my-1">
                        {token.logo && (
                          <img
                            src={token.logo}
                            alt={token.symbol ?? 'token logo'}
                            width={20}
                            height={20}
                          />
                        )}
                        <span>{token.symbol}: {parseFloat(token.balance).toFixed(6)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        
          {connection.status !== 'connected' && (
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
          )}
        </div>
      </div>
    </>
  )
}

export default App
