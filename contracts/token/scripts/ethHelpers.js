const { ethers } = require('ethers');

async function getNonce(address){
    let provider;
    if (ethers.providers && ethers.providers.JsonRpcProvider) {
        // ethers v5
        provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.org/');
    } else if (ethers.JsonRpcProvider) {
        // ethers v6
        provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org/');
    } else {
        throw new Error('Unable to create JsonRpcProvider. Check ethers version and import.');
    }
    const nonce = await provider.getTransactionCount(address);
    return nonce;
}

async function getGasDetails(){
    let provider;
    if (ethers.providers && ethers.providers.JsonRpcProvider) {
        // ethers v5
        provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.org/');
    } else if (ethers.JsonRpcProvider) {
        // ethers v6
        provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org/');
    } else {
        throw new Error('Unable to create JsonRpcProvider. Check ethers version and import.');
    }
    const feeData = await provider.getFeeData();
    maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    maxFeePerGas = feeData.maxFeePerGas;
    return {maxPriorityFeePerGas, maxFeePerGas};
}

async function sendRawTransaction(signedTxBytes) {
    console.log('Received signedTxBytes:', signedTxBytes);
    
    // Convert Vec<u8> to hexadecimal string
    const signedTxHex = '0x' + Buffer.from(signedTxBytes).toString('hex');
    console.log('Converted to hex:', signedTxHex);

    // Set up the Ethereum provider
    let provider;
    if (ethers.providers && ethers.providers.JsonRpcProvider) {
        // ethers v5
        provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.org/');
    } else if (ethers.JsonRpcProvider) {
        // ethers v6
        provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org/');
    } else {
        throw new Error('Unable to create JsonRpcProvider. Check ethers version and import.');
    }
    console.log('Provider set up');

    try {
        console.log('Attempting to send transaction...');
        // Send the raw transaction
        const tx = await provider.broadcastTransaction(signedTxHex);
        console.log('Transaction sent successfully. Hash:', tx.hash);
        
        // Wait for the transaction to be mined
        console.log('Waiting for transaction to be mined...');
        const receipt = await tx.wait();
        console.log('Transaction mined. Block number:', receipt.blockNumber);

        return tx.hash;
    } catch (error) {
        console.error('Failed to send transaction. Error details:', error);
        if (error.reason) console.error('Error reason:', error.reason);
        if (error.code) console.error('Error code:', error.code);
        if (error.transaction) console.error('Error transaction:', error.transaction);
        throw error;
    }
}

// // // Your signedTxBytes array
// const signedTxBytes = [2,248,178,131,170,54,167,1,131,15,76,216,133,3,30,244,52,128,130,234,96,148,102,28,24,162,165,219,20,202,211,76,98,195,114,31,235,209,223,233,74,18,128,184,68,169,5,156,187,0,0,0,0,0,0,0,0,0,0,0,0,133,48,116,132,32,210,166,125,89,225,251,13,47,51,183,27,81,255,57,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,224,182,179,167,100,0,0,192,128,160,238,113,239,52,61,75,238,222,165,206,78,214,20,250,221,205,135,173,249,167,26,67,78,153,159,92,201,136,228,47,173,85,160,29,88,35,187,80,49,185,74,69,134,169,55,223,208,145,18,246,150,75,104,248,76,90,198,151,136,161,88,37,228,59,57];


// // Execute the function
// sendRawTransaction(signedTxBytes)
//     .then(txHash => console.log('Final transaction hash:', txHash))
//     .catch(error => {
//         console.error('Error in main execution:', error);
//         process.exit(1);
//     })
//     .finally(() => {
//         console.log('Script execution completed');
//         process.exit(0);
//     });

module.exports = { sendRawTransaction, getNonce, getGasDetails };