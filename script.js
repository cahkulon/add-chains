let chains = [];

const loadChains = async () => {
  const res = await fetch('chains.json');
  chains = await res.json();
  displayChains(chains);
};

const displayChains = (chainList) => {
  const container = document.getElementById('chainCards');
  container.innerHTML = '';

  chainList.forEach(chain => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${chain.icon}" alt="${chain.chainName} logo" />
      <h3>${chain.chainName}</h3>
      <p><strong>Chain ID:</strong> ${chain.chainId}</p>
      <p><strong>Symbol:</strong> ${chain.nativeCurrency.symbol}</p>
      <p><strong>RPC:</strong> ${chain.rpcUrls[0]}</p>
      <p><strong>Explorer:</strong> ${chain.blockExplorerUrls[0]}</p>
      <button onclick='addChain(${JSON.stringify(chain)})'>Add Chain</button>
    `;

    container.appendChild(card);
  });
};

const addChain = async (chain) => {
  const providerType = document.getElementById('walletSelector').value;

  const ethereum = window.ethereum;

  if (!ethereum) {
    alert("No wallet detected!");
    return;
  }

  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [chain]
    });
  } catch (err) {
    console.error(err);
    alert("Failed to add chain.");
  }
};

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = chains.filter(chain =>
    chain.chainName.toLowerCase().includes(term)
  );
  displayChains(filtered);
});

window.addEventListener('DOMContentLoaded', loadChains);
