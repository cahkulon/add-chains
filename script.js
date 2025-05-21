let chains = [];
const chainMap = {};

const sanitizeChain = (chain) => ({
  chainId: chain.chainId,
  chainName: chain.chainName,
  nativeCurrency: chain.nativeCurrency,
  rpcUrls: chain.rpcUrls,
  blockExplorerUrls: chain.blockExplorerUrls
});

const displayChains = (chainList) => {
  const container = document.getElementById('chainCards');
  container.innerHTML = '';

  chainList.forEach((chain, index) => {
    const id = `chain-${index}`;
    chainMap[id] = chain;

    const decimalId = parseInt(chain.chainId, 16);
    const multipleRpc = chain.rpcUrls.length > 1;

    let rpcElement = `<p><strong>RPC:</strong> ${chain.rpcUrls[0]}</p>`;
    if (multipleRpc) {
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
      <p><strong>Chain ID:</strong> ${decimalId}</p>
      <p><strong>Symbol:</strong> ${chain.nativeCurrency.symbol}</p>
      ${rpcElement}
      <p><strong>Explorer:</strong> ${chain.blockExplorerUrls[0]}</p>
      <button data-id="${id}">Add Chain</button>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const chain = { ...chainMap[id] };

      const select = document.querySelector(`select[data-rpc-select="${id}"]`);
      if (select) {
        chain.rpcUrls = [select.value];
      }

      addChain(chain);
    });
  });
};

const addChain = async (chain) => {
  const wallet = document.getElementById('walletSelector').value;

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
      params: [sanitizeChain(chain)]
    });
  } catch (err) {
    console.error('Error adding chain:', err);
    alert('Failed to add chain.');
  }
};

const loadChains = async () => {
  const res = await fetch('evm.json');
  chains = await res.json();
  displayChains(chains);
};

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = chains.filter(c => c.chainName.toLowerCase().includes(term));
  displayChains(filtered);
});

window.addEventListener('DOMContentLoaded', loadChains);
