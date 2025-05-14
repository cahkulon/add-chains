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

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${chain.chainName}</h3>
      <p><strong>Chain ID:</strong> ${chain.chainId}</p>
      <p><strong>Symbol:</strong> ${chain.nativeCurrency.symbol}</p>
      <p><strong>RPC:</strong> ${chain.rpcUrls[0]}</p>
      <p><strong>Explorer:</strong> ${chain.blockExplorerUrls[0]}</p>
      <button data-id="${id}">Add Chain</button>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const chain = chainMap[btn.getAttribute('data-id')];
      addChain(chain);
    });
  });
};

const addChain = async (chain) => {
  const ethereum = window.ethereum;
  if (!ethereum) {
    alert("Wallet not detected.");
    return;
  }

  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [sanitizeChain(chain)]
    });
  } catch (err) {
    console.error('Error adding chain:', err);
    alert('Failed to add chain.');
  }
};

const loadChains = async () => {
  const res = await fetch('chains.json');
  chains = await res.json();
  displayChains(chains);
};

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = chains.filter(c =>
    c.chainName.toLowerCase().includes(term)
  );
  displayChains(filtered);
});

window.addEventListener('DOMContentLoaded', loadChains);
