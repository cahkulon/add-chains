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

const addChain = async (chain, chainType) => {
  const wallet = document.getElementById('walletSelector').value;

  if (chainType === 'evm') {
    let provider = null;
    if (wallet === 'metamask' && window.ethereum?.isMetaMask) {
      provider = window.ethereum;
    } else if (wallet === 'okx' && window.okxwallet?.ethereum) {
      provider = window.okxwallet.ethereum;
    } else if (wallet === 'injected') {
      provider = window.ethereum;
    }

    if (!provider) {
      alert("Selected wallet provider not found.");
      return;
    }

    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [sanitizeChain(chain, chainType)]
      });
    } catch (err) {
      console.error('Error adding chain:', err);
      alert('Failed to add chain.');
    }
  } else if (chainType === 'cosmos') {
    if (wallet === 'keplr' && window.keplr) {
      try {
        await window.keplr.experimentalSuggestChain(sanitizeChain(chain, chainType));
        await window.keplr.enable(chain.chainId);
        alert('Chain added successfully!');
      } catch (err) {
        console.error('Error adding chain:', err);
        alert('Failed to add chain.');
      }
    } else if (wallet === 'leap' && window.leap) {
      try {
        await window.leap.experimentalSuggestChain(sanitizeChain(chain, chainType));
        await window.leap.enable(chain.chainId);
        alert('Chain added successfully!');
      } catch (err) {
        console.error('Error adding chain:', err);
        alert('Failed to add chain.');
      }
    } else {
      alert("Selected wallet provider not found.");
    }
  }
};

const loadChains = async (chainType) => {
  let file = 'evm.json';
  if (chainType === 'cosmos') file = 'cosmos.json';
  
  const res = await fetch(file);
  chains = await res.json();
  displayChains(chains, chainType);
};

document.getElementById('chainTypeSelector').addEventListener('change', (e) => {
  const chainType = e.target.value;
  updateWalletSelector(chainType);
  loadChains(chainType);
});

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
});