const aahChainId = 21133;

const jsfn_start = () => {
    let web3;
    jsfn_connect = async() => {
        const {ethereum} = window;
        if(ethereum) {
            console.log("ethreum provider detected");
            await ethereum.request({method: 'eth_requestAccounts'});
            web3 = new Web3(ethereum);
            await jsfn_switchNetwork(aahChainId);
        }
    }

    getCurrentChainId = async () => {
        const currentChainId = await web3.eth.getChainId();
        console.log("current chainId:", currentChainId);
        return currentChainId;
    }

    jsfn_switchNetwork = async (chainId) => {
        const currentChainId = await web3.eth.getChainId();
        if (currentChainId != chainId){
            try {
                await ethereum.request({
                    method:'wallet_switchEthereumChain',
                    params: [{chainId: Web3.utils.toHex(chainId)}]
                });
                console.log(`switched to chainid : ${chainId} succesfully`);
            }catch(err){
                console.log(`error occured while switching chain to chainId ${chainId}, err: ${err.message} code: ${err.code}`);
                if (err.code === 4902){
                    jsfn_addNetwork(aahNetwork);
                }
            }
        }
    }

    const aahNetwork = {
        chainId:Web3.utils.toHex(aahChainId),
        chainName: "All About Healthy",
        nativeCurrency: {
          name: "All About Healthy",
          symbol: "AAH", // 2-6 characters long
          decimals: 18
        },
        rpcUrls: ["https://rpc.c4ex.net/"],
        blockExplorerUrls:["https://exp.c4ex.net/"],
        iconUrls: ["https://i.ibb.co/VLXwBY3/AAH-256.png"]
    }

    jsfn_addNetwork = async(networkDetails) => {
        try{
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    networkDetails
                ]
              });
        }catch(err){
            console.log(`error ocuured while adding new chain with chainId:${networkDetails.chainId}, err: ${err.message}`)
        }
    }

    jsfn_connect();
}

window.addEventListener('DOMContentLoaded', jsfn_start);
