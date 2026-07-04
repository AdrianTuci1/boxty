use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Helper function to perform a simple FNV-1a hash (simulating IPFS CID hash)
#[allow(dead_code)]
fn simulate_cid_hash(data: &[u8]) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in data {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("QmBoxtyObjectCID{:016x}", hash)
}

/// Simulates symmetric encryption (XOR with key derivation for object storage)
#[allow(dead_code)]
fn simulate_encrypt(key: &[u8; 32], plaintext: &[u8]) -> Vec<u8> {
    let mut ciphertext = vec![0u8; plaintext.len()];
    for i in 0..plaintext.len() {
        let mut key_hasher: u64 = 0xcbf29ce484222325;
        for byte in key {
            key_hasher ^= *byte as u64;
            key_hasher = key_hasher.wrapping_mul(0x100000001b3);
        }
        key_hasher ^= i as u64;
        key_hasher = key_hasher.wrapping_mul(0x100000001b3);
        let key_byte = (key_hasher & 0xFF) as u8;
        ciphertext[i] = plaintext[i] ^ key_byte;
    }
    ciphertext
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[allow(dead_code)]
pub struct EncryptedObject {
    pub cid: String,
    pub encrypted_bytes: Vec<u8>,
    pub metadata_key: String,
}

#[allow(dead_code)]
pub struct DecentralizedBucket {
    pub bucket_name: String,
    pub encryption_key: [u8; 32],
    // Simulates the local client cache of uploaded CIDs mapped to logical keys
    pub local_index: HashMap<String, String>,
}

#[allow(dead_code)]
impl DecentralizedBucket {
    pub fn new(name: &str, key: [u8; 32]) -> Self {
        Self {
            bucket_name: name.to_string(),
            encryption_key: key,
            local_index: HashMap::new(),
        }
    }

    /// Uploads an object, encrypting it client-side before distributing it to P2P storage nodes
    pub fn put_object(
        &mut self,
        key: &str,
        data: &[u8],
    ) -> Result<String, Box<dyn std::error::Error>> {
        println!(
            "\n[Bucket {}] Preparing upload of object '{}'...",
            self.bucket_name, key
        );

        // 1. Client-side encryption
        let encrypted_bytes = simulate_encrypt(&self.encryption_key, data);

        // 2. Generate Content Identifier (CID) based on encrypted data hash
        let cid = simulate_cid_hash(&encrypted_bytes);
        println!(
            "   [Encrypt] Plaintext size: {} bytes | Encrypted size: {} bytes",
            data.len(),
            encrypted_bytes.len()
        );
        println!("   [P2P CID] Generated Content Identifier: {}", cid);

        self.local_index.insert(key.to_string(), cid.clone());
        Ok(cid)
    }

    /// Decrypts downloaded encrypted bytes using the client-side master key
    pub fn decrypt_object(
        &self,
        encrypted_bytes: &[u8],
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let plaintext_bytes = simulate_encrypt(&self.encryption_key, encrypted_bytes);
        Ok(plaintext_bytes)
    }
}

/// Represents the P2P storage provider hosting raw encrypted object blobs (untrusted storage)
#[allow(dead_code)]
pub struct UntrustedObjectProvider {
    pub peer_id: String,
    pub store: HashMap<String, Vec<u8>>, // CID -> Encrypted bytes
}

#[allow(dead_code)]
impl UntrustedObjectProvider {
    pub fn new(peer_id: &str) -> Self {
        Self {
            peer_id: peer_id.to_string(),
            store: HashMap::new(),
        }
    }

    /// Stores an encrypted object block on behalf of the client
    pub fn store_block(&mut self, cid: &str, encrypted_data: &[u8]) {
        println!(
            "[P2P Node {}] Storing encrypted binary object block under CID: {}",
            self.peer_id, cid
        );
        self.store.insert(cid.to_string(), encrypted_data.to_vec());
    }

    /// Retrieves an encrypted block by CID
    pub fn get_block(&self, cid: &str) -> Option<&Vec<u8>> {
        println!(
            "[P2P Node {}] Serving encrypted block for CID: {}",
            self.peer_id, cid
        );
        self.store.get(cid)
    }

    /// Deletes an object by CID
    pub fn delete_block(&mut self, cid: &str) -> bool {
        println!(
            "[P2P Node {}] Deleting block under CID: {}",
            self.peer_id, cid
        );
        self.store.remove(cid).is_some()
    }
}
