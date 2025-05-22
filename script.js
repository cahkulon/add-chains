let chains = [];
const chainMap = {};
const WALLETS = {
  evm: [
    { value: 'metamask', name: 'MetaMask' },
    { value: 'okx', name: 'OKX Wallet' },
    { value: 'injected', name: 'Injected Wallet' }
  ],
  cosmos: [
    { value: 'keplr', name: 'Keplr Wallet' },
    { value: 'leap', name: 'Leap Wallet' }
  ]
};

const TOKEN_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "type": "function"
  }
];

const sanitizeChain = (chain, chainType) => {
  if (chainType === 'evm') {
    return {
      chainId: chain.chainId,
      chainName: chain.chainName,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpcUrls,
      blockExplorerUrls: chain.blockExplorerUrls
    };
  } else if (chainType === 'cosmos') {
    return {
      chainId: chain.chainId,
      chainName: chain.chainName,
      rest: chain.rest,
      rpc: chain.rpc,
      bech32Config: chain.bech32Config
    };
  }
  return chain;
};

const displayChains = (chainList, chainType) => {
  const container = document.getElementById('chainCards');
  container.innerHTML = '';

  chainList.forEach((chain, index) => {
    const id = `chain-${index}`;
    chainMap[id] = chain;

    let chainIdDisplay = chain.chainId;
    if (chainType === 'evm') {
      chainIdDisplay = `${parseInt(chain.chainId, 16)} (${chain.chainId})`;
    }

    let rpcElement = `<p><strong>RPC:</strong> ${chain.rpcUrls?.[0] || chain.rpc}</p>`;
    if (chain.rpcUrls?.length > 1) {
      const rpcOptions = chain.rpcUrls.map(url => `<option value="${url}">${url}</option>`).join('');
      rpcElement = `
        <label><strong>RPC URL:</strong></label>
        <select data-rpc-select="${id}">
          ${rpcOptions}
        </select>
      `;
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${chain.chainName}</h3>
      <p><strong>Chain ID:</strong> ${chainIdDisplay}</p>
      ${chain.nativeCurrency ? `<p><strong>Symbol:</strong> ${chain.nativeCurrency.symbol}</p>` : ''}
      ${rpcElement}
      ${chain.blockExplorerUrls ? `<p><strong>Explorer:</strong> ${chain.blockExplorerUrls[0]}</p>` : ''}
      <button data-id="${id}" data-type="${chainType}">Add Chain</button>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const chainType = btn.getAttribute('data-type');
      const chain = { ...chainMap[id] };

      const select = document.querySelector(`select[data-rpc-select="${id}"]`);
      if (select) {
        if (chainType === 'evm') {
          chain.rpcUrls = [select.value];
        } else {
          chain.rpc = select.value;
        }
      }

      addChain(chain, chainType);
    });
  });
};

const updateWalletSelector = (chainType) => {
  const container = document.getElementById('walletSelectorContainer');
  container.innerHTML = '';

  const select = document.createElement('select');
  select.id = 'walletSelector';

  WALLETS[chainType].forEach(wallet => {
    const option = document.createElement('option');
    option.value = wallet.value;
    option.textContent = wallet.name;
    select.appendChild(option);
  });

  container.appendChild(select);
};

const getEVMProvider = (wallet) => {
  switch (wallet) {
    case 'metamask':
      return window.ethereum?.isMetaMask ? window.ethereum : null;
    case 'okx':
      return window.okxwallet?.ethereum ? window.okxwallet.ethereum : null;
    case 'injected':
      return window.ethereum || null;
    default:
      return null;
  }
};

const addChain = async (chain, chainType) => {
  const wallet = document.getElementById('walletSelector').value;

  if (chainType === 'evm') {
    const provider = getEVMProvider(wallet);

    if (!provider) {
      alert(`Selected wallet provider (${wallet}) not found. Please make sure the wallet extension is installed and enabled.`);
      return;
    }

    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [sanitizeChain(chain, chainType)]
      });
    } catch (err) {
      console.error('Error adding chain:', err);
      alert('Failed to add chain: ' + (err.message || err));
    }
  } else if (chainType === 'cosmos') {
    if (wallet === 'keplr' && window.keplr) {
      try {
        await window.keplr.experimentalSuggestChain(sanitizeChain(chain, chainType));
        await window.keplr.enable(chain.chainId);
        alert('Chain added successfully!');
      } catch (err) {
        console.error('Error adding chain:', err);
        alert('Failed to add chain: ' + (err.message || err));
      }
    } else if (wallet === 'leap' && window.leap) {
      try {
        await window.leap.experimentalSuggestChain(sanitizeChain(chain, chainType));
        await window.leap.enable(chain.chainId);
        alert('Chain added successfully!');
      } catch (err) {
        console.error('Error adding chain:', err);
        alert('Failed to add chain: ' + (err.message || err));
      }
    } else {
      alert(`Selected wallet provider (${wallet}) not found. Please make sure the wallet extension is installed and enabled.`);
    }
  }
};

const fetchTokenDetails = async (tokenAddress, rpcUrl) => {
  if (!rpcUrl) throw new Error("RPC URL not provided");
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

  const [symbol, decimals] = await Promise.all([
    tokenContract.symbol().catch(() => ''),
    tokenContract.decimals().catch(() => 18)
  ]);

  return {
    symbol: symbol || 'UNKNOWN',
    decimals: decimals.toString() || '18'
  };
};

const checkTokenInfo = async () => {
  const tokenAddress = document.getElementById('tokenAddressInput').value.trim();
  const rpcUrl = document.getElementById('tokenChainSelector').value;
  const loadingElement = document.getElementById('addressLoading');

  if (!tokenAddress) {
    alert("Please enter token address");
    return;
  }

  if (!ethers.utils.isAddress(tokenAddress)) {
    alert("Please enter a valid token address");
    return;
  }

  loadingElement.style.display = 'inline-block';
  document.getElementById('tokenSymbolInput').value = '';
  document.getElementById('tokenDecimalsInput').value = '';

  try {
    const tokenDetails = await fetchTokenDetails(tokenAddress, rpcUrl);
    document.getElementById('tokenSymbolInput').value = tokenDetails.symbol;
    document.getElementById('tokenDecimalsInput').value = tokenDetails.decimals;
    alert("Token info fetched successfully!");
  } catch (error) {
    console.error("Error fetching token details:", error);
    alert("Failed to fetch token info: " + error.message);
  } finally {
    loadingElement.style.display = 'none';
  }
};

const addToken = async () => {
  const tokenAddress = document.getElementById('tokenAddressInput').value.trim();
  const tokenSymbol = document.getElementById('tokenSymbolInput').value.trim();
  const tokenDecimals = document.getElementById('tokenDecimalsInput').value.trim();
  const rpcUrl = document.getElementById('tokenChainSelector').value;
  const wallet = document.getElementById('walletSelector').value;
  const chainType = document.getElementById('chainTypeSelector').value;

  if (!tokenAddress || !tokenSymbol || !tokenDecimals) {
    alert("Please check token info first and fill all required fields");
    return;
  }

  if (!ethers.utils.isAddress(tokenAddress)) {
    alert("Please enter a valid token address");
    return;
  }

  const selectedChain = chains.find(chain => (chain.rpcUrls?.[0] === rpcUrl || chain.rpc === rpcUrl));
  if (!selectedChain) {
    alert("Selected chain not found");
    return;
  }

  if (chainType === 'evm') {
    const provider = getEVMProvider(wallet);

    if (!provider) {
      alert(`Selected wallet provider (${wallet}) not found. Please make sure the wallet extension is installed and enabled.`);
      return;
    }

    try {
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: parseInt(tokenDecimals),
            chainId: selectedChain.chainId
          }
        }
      });
      alert('Token added successfully!');
    } catch (err) {
      console.error('Error adding token:', err);
      alert('Failed to add token: ' + (err.message || err));
    }
  } else if (chainType === 'cosmos') {
    alert("Cosmos wallets typically don't support programmatic token addition. Please add the token manually in your wallet.");
  }
};

const setupTokenUI = () => {
  document.getElementById('checkTokenBtn').addEventListener('click', checkTokenInfo);
  document.getElementById('addTokenBtn').addEventListener('click', addToken);
  updateTokenChainSelector();
};

const updateTokenChainSelector = () => {
  const selector = document.getElementById('tokenChainSelector');
  selector.innerHTML = chains.map(chain => {
    const rpcUrl = chain.rpcUrls?.[0] || chain.rpc || "";
    return `<option value="${rpcUrl}">${chain.chainName}</option>`;
  }).join('');
};

const loadChains = async (chainType) => {
  let file = 'evm.json';
  if (chainType === 'cosmos') file = 'cosmos.json';

  const res = await fetch(file);
  chains = await res.json();
  displayChains(chains, chainType);

  if (!document.getElementById('tokenSection')) {
    setupTokenUI();
  } else {
    updateTokenChainSelector();
  }
};

document.getElementById('chainTypeSelector').addEventListener('change', (e) => {
  const chainType = e.target.value;
  updateWalletSelector(chainType);
  loadChains(chainType);
});

// Tambahkan fungsi refreshChains
const refreshChains = () => {
  const chainType = document.getElementById('chainTypeSelector').value;
  loadChains(chainType);
  alert(`Refreshing ${chainType.toUpperCase()} chains data...`);
};

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = chains.filter(c => c.chainName.toLowerCase().includes(term));
  const chainType = document.getElementById('chainTypeSelector').value;
  displayChains(filtered, chainType);
});

window.addEventListener('DOMContentLoaded', () => {
  const chainType = document.getElementById('chainTypeSelector').value;
  updateWalletSelector(chainType);
  loadChains(chainType);

  // Event listener untuk tombol refresh
  document.getElementById('refreshBtn').addEventListener('click', refreshChains);
});
