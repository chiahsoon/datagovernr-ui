# DataGovernR UI

## Features
1. Encryption/Decryption via AES-256-GCM.
    * Password-based key management via [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2).
    * Key-splitting/sharing via [Vernam's Cipher](https://en.wikipedia.org/wiki/Gilbert_Vernam#The_Vernam_cipher).
2. Proof of Upload Time using blockchain(s) via [OriginStamp](https://originstamp.com/).

## Dependencies 
* [Dataverse](https://guides.dataverse.org/en/latest/developers/dev-environment.html#id2)
* [Backend](https://github.com/chiahsoon/datagovernr-api)

## Development
> We assume use of `Yarn` here
1. Start a local instance of Dataverse and the backend.
2. Add DataGovernR as an external tool (only once!) for your local Dataverse instance by executing this at the root of this repository (more info [here](https://guides.dataverse.org/en/latest/admin/external-tools.html#managing-external-tools)):
    ```bash
    curl -X POST -H 'Content-type: application/json' http://localhost:8080/api/admin/externalTools --upload-file datagovernr.json
    ```
3. Create a `.env.development` file with the following variables:

   | Key      | Value |
   | ----------- | ----------- |
   | REACT_APP_API_URL      | [Your API URL]       |

4. Install dependencies via `yarn install`.
5. Start the developmental server using `yarn start`.
6. To properly access DataGovernR, navigate to a dataset in Dataverse and click on `Access Dataset` to access DataGovernR.
## Deployment
* Not attempted yet, may have unexpected issues.

## Overview
>[Overall Architecture](https://entuedu-my.sharepoint.com/:i:/g/personal/chua0886_e_ntu_edu_sg/EWrtSfNBFGpCm3ezxFG_GGkBsrWB8OTHU11X7u3v9Yc6hA?e=PYDuYD)
### Upload & Encryption
* User-entered password are combined with random salts to generate different keys for every uploaded file, even if they are in the same upload 'batch'.
    * If desired, key shares for each file in a 'batch' are generated and downloaded to the uploader's desktop.
* The plaintext file hash and encrypted file hash is generated for each file and sent to the backend, together with the salt.
* At a specified interval, cronjobs are used to aggregate these hashes and send them to OriginStamp.
* [Sequence Diagram](https://entuedu-my.sharepoint.com/:i:/g/personal/chua0886_e_ntu_edu_sg/ESPZO5QAXlNAqjl2XpGfBHoB-yO8RpMsBHzi-4VPvcExpA?e=gYGYpb)

### Download & Decryption
* Key is regenerated in 2 ways:
    * Salt is retrieved from the backend and combined with the password to obtain the key
    * Key shares are combined to obtain the key
* File decrypted and download to the user's desktop.
* [Sequence Diagram](https://entuedu-my.sharepoint.com/:i:/g/personal/chua0886_e_ntu_edu_sg/EedbNlIF23JIuR6dy-tLf0QBaOeVo9KJDRInOu-hVTpiRQ?e=S0sQkY)
### Proof of Upload
* OriginStamp provides HTTP APIs to submit timestamped hashes to the blockchain
    * NOT a trusted third party - hashes can be verified independently via various block explorers.
* More details can be found in the backend repository.
