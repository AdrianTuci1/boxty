use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Helper function to perform a simple FNV-1a hash (used for simulation of HMAC/SHA)
#[allow(dead_code)]
fn fnv1a_hash(data: &str) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in data.bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{:016x}", hash)
}

/// Helper function to perform a keyed FNV-1a hash (simulating HMAC-SHA256 for Searchable Encryption)
fn keyed_hash(key: &[u8], data: &str) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in key {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    for byte in data.bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{:016x}", hash)
}

/// Simulates symmetric encryption (XOR with key derivation for teaching purposes)
/// In production, a standard AEAD cipher like ChaCha20-Poly1305 or AES-GCM should be used.
fn simulate_encrypt(key: &[u8], plaintext: &[u8]) -> Vec<u8> {
    let mut ciphertext = vec![0u8; plaintext.len()];
    for i in 0..plaintext.len() {
        // Derive a pseudo-random byte for XOR based on the key and position
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

/// Simulates symmetric decryption (XOR is symmetric)
fn simulate_decrypt(key: &[u8], ciphertext: &[u8]) -> Vec<u8> {
    simulate_encrypt(key, ciphertext) // XOR decryption is identical to encryption
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SearchableTag {
    pub field_hash: String, // Keyed hash of the column/field name
    pub value_hash: String, // Keyed hash of the field value
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EncryptedRecord {
    pub id: String,
    pub encrypted_data: Vec<u8>,
    pub tags: Vec<SearchableTag>,
}

pub struct EncryptedDatabase {
    pub local_key: [u8; 32],
    pub records: Vec<EncryptedRecord>,
}

impl EncryptedDatabase {
    pub fn new(key: [u8; 32]) -> Self {
        Self {
            local_key: key,
            records: Vec::new(),
        }
    }

    /// Inserts a new record, encrypting the payload client-side and generating searchable tags
    pub fn insert_record(&mut self, id: &str, data: &str, searchable_fields: &[(&str, &str)]) {
        println!("\n[Client DB] Preparing to insert record '{}'...", id);

        // 1. Client-Side Encryption
        let plaintext_bytes = data.as_bytes();
        let encrypted_payload = simulate_encrypt(&self.local_key, plaintext_bytes);
        println!(
            "   [Encrypt] Plaintext size: {} bytes | Ciphertext size: {} bytes",
            plaintext_bytes.len(),
            encrypted_payload.len()
        );

        // 2. Generate Searchable Tags (Searchable Encryption)
        let mut tags = Vec::new();
        for (field_name, field_value) in searchable_fields {
            // We hash the field name and value with our local key so a third party cannot know what they are
            let field_hash = keyed_hash(&self.local_key, field_name);
            let value_hash = keyed_hash(&self.local_key, field_value);
            println!(
                "   [Index] Creating encrypted tag: {}='{}' -> (field_hash: {}, value_hash: {})",
                field_name,
                field_value,
                &field_hash[0..8],
                &value_hash[0..8]
            );

            tags.push(SearchableTag {
                field_hash,
                value_hash,
            });
        }

        self.records.push(EncryptedRecord {
            id: id.to_string(),
            encrypted_data: encrypted_payload,
            tags,
        });
        println!(
            "   [Client DB] Record '{}' encrypted and appended to local state.",
            id
        );
    }

    /// Simulates serializing the entire database to send to P2P Provider replicas
    pub fn get_sync_payload(&self) -> Vec<u8> {
        serde_json::to_vec(&self.records).unwrap()
    }

    /// Decrypts a specific record locally using the client key
    #[allow(dead_code)]
    pub fn decrypt_record(
        &self,
        record: &EncryptedRecord,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let decrypted_bytes = simulate_decrypt(&self.local_key, &record.encrypted_data);
        let plaintext = String::from_utf8(decrypted_bytes)?;
        Ok(plaintext)
    }

    /// Retrieves a record by ID and decrypts it
    #[allow(dead_code)]
    pub fn get_record(&self, id: &str) -> Result<Option<String>, Box<dyn std::error::Error>> {
        if let Some(record) = self.records.iter().find(|r| r.id == id) {
            let plaintext = self.decrypt_record(record)?;
            Ok(Some(plaintext))
        } else {
            Ok(None)
        }
    }

    /// Updates an existing record, re-encrypting the data and regenerating searchable tags
    #[allow(dead_code)]
    pub fn update_record(
        &mut self,
        id: &str,
        data: &str,
        searchable_fields: &[(&str, &str)],
    ) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n[Client DB] Updating record '{}'...", id);

        // Remove old record
        if let Some(pos) = self.records.iter().position(|r| r.id == id) {
            self.records.remove(pos);
        } else {
            return Err("Record not found".into());
        }

        // Insert new record
        self.insert_record(id, data, searchable_fields);
        Ok(())
    }

    /// Deletes a record from the database
    #[allow(dead_code)]
    pub fn delete_record(&mut self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n[Client DB] Deleting record '{}'...", id);
        if let Some(pos) = self.records.iter().position(|r| r.id == id) {
            self.records.remove(pos);
            Ok(())
        } else {
            Err("Record not found".into())
        }
    }
}

/// Represents the P2P Provider host (untrusted server) storing the database
pub struct UntrustedStorageProvider {
    pub peer_id: String,
    pub database_records: Vec<EncryptedRecord>,
}

impl UntrustedStorageProvider {
    pub fn new(peer_id: &str) -> Self {
        Self {
            peer_id: peer_id.to_string(),
            database_records: Vec::new(),
        }
    }

    /// Merges an incoming encrypted database state (CRDT-like sync of encrypted records)
    pub fn merge_encrypted_db(&mut self, payload: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
        let incoming: Vec<EncryptedRecord> = serde_json::from_slice(payload)?;

        // Simple merge logic: replace or append records based on ID
        let mut record_map: HashMap<String, EncryptedRecord> = self
            .database_records
            .drain(..)
            .map(|r| (r.id.clone(), r))
            .collect();

        for rec in incoming {
            record_map.insert(rec.id.clone(), rec);
        }

        self.database_records = record_map.into_values().collect();
        println!(
            "[P2P Node {}] Synced and merged database state. Total stored records: {}",
            self.peer_id,
            self.database_records.len()
        );
        Ok(())
    }

    /// Executes a search query over the encrypted records on behalf of a client
    /// The provider has NO access to the decryption key. It only matches hash values.
    pub fn search_encrypted(
        &self,
        query_field_hash: &str,
        query_value_hash: &str,
    ) -> Vec<EncryptedRecord> {
        println!(
            "\n[P2P Node {}] Executing Zero-Knowledge Search...",
            self.peer_id
        );
        println!(
            "   Querying tag (field_hash: {}, value_hash: {})",
            &query_field_hash[0..8],
            &query_value_hash[0..8]
        );

        let mut matches = Vec::new();
        for record in &self.database_records {
            for tag in &record.tags {
                if tag.field_hash == query_field_hash && tag.value_hash == query_value_hash {
                    println!(
                        "   [Match Found] Record ID: {} matches query hashes.",
                        record.id
                    );
                    matches.push(record.clone());
                }
            }
        }

        if matches.is_empty() {
            println!("   [Zero Results] No records match the query hashes.");
        }
        matches
    }

    /// Simulates deleting an encrypted record on the provider node (propagated deletion)
    #[allow(dead_code)]
    #[allow(dead_code)]
    pub fn delete_record_untrusted(&mut self, id: &str) -> bool {
        println!(
            "[P2P Node {}] Deleting encrypted record ID: {}",
            self.peer_id, id
        );
        let initial_len = self.database_records.len();
        self.database_records.retain(|r| r.id != id);
        self.database_records.len() < initial_len
    }
}

/// Simulates a TEE secure runtime that can execute queries offline using attestation
#[allow(dead_code)]
pub struct TeeEnclaveSimulator {
    pub enclave_id: String,
    pub is_secure_enclave: bool,
}

impl TeeEnclaveSimulator {
    pub fn new() -> Self {
        Self {
            enclave_id: format!("tee-enclave-{}", rand::random::<u16>()),
            is_secure_enclave: true,
        }
    }

    /// Generates a hardware-attested report containing the hash of the running code (MRENCLAVE)
    pub fn generate_attestation_report(&self, expected_code_hash: &[u8]) -> Vec<u8> {
        println!(
            "\n[TEE {}] Generating hardware attestation report...",
            self.enclave_id
        );

        // In AMD SEV/Intel SGX, this report is signed by the CPU security processor's root key.
        // We simulate the signature wrapping.
        let mut report = Vec::new();
        report.extend_from_slice(b"TEE_REPORT_SIGNATURE_VALID_CPU_ROOT:");
        report.extend_from_slice(expected_code_hash);
        report
    }

    /// Request and reconstruct keys from Key Custodians holding Shamir's secret key shares
    pub fn request_key_from_custodians(
        &self,
        report: &[u8],
        custodian_endpoints: &[String],
    ) -> Result<[u8; 32], Box<dyn std::error::Error>> {
        println!(
            "\n[TEE {}] Submitting hardware attestation report to custodians...",
            self.enclave_id
        );

        if !report.starts_with(b"TEE_REPORT_SIGNATURE_VALID_CPU_ROOT:") {
            return Err("Attestation verification failed: Invalid hardware signature".into());
        }

        println!("   [Attestation Verification] Success: Code signature matches expectations.");
        println!("   [Consensus] Requesting Shamir Secret Sharing parts...");

        // Simulate reconstructing a key from key shares (e.g. 2-of-3 threshold)
        // In a real system we would use the wallet::reconstruct_api_key, here we do a 32-byte key reconstruction
        let mut combined_key = [0u8; 32];
        for (i, endpoint) in custodian_endpoints.iter().take(2).enumerate() {
            println!(
                "   - Connecting to Custodian {}... Share {}/2 received.",
                endpoint,
                i + 1
            );
            // Simulate contribution to key recovery
            for j in 0..32 {
                combined_key[j] ^= (i + 1 + j) as u8 ^ 0x55;
            }
        }

        println!(
            "   [TEE {}] Master Decryption Key reconstructed in secure RAM.",
            self.enclave_id
        );
        Ok(combined_key)
    }

    /// Runs a secure background query/processing within the enclaves RAM
    pub fn process_data_offline(
        &self,
        db_key: &[u8; 32],
        records: &[EncryptedRecord],
    ) -> Result<(), Box<dyn std::error::Error>> {
        println!(
            "\n[TEE {} Offline Cron] Starting database batch processing...",
            self.enclave_id
        );
        println!("   Decrypting database records directly in CPU-encrypted memory...");

        for record in records {
            let plaintext_bytes = simulate_decrypt(db_key, &record.encrypted_data);
            let plaintext = String::from_utf8(plaintext_bytes)?;
            println!(
                "   [Decrypted in Enclave RAM] ID: '{}' -> Content: '{}'",
                record.id, plaintext
            );
        }

        println!(
            "   [TEE {} Offline Cron] Processing complete. Clearing keys from CPU registers.",
            self.enclave_id
        );
        Ok(())
    }
}

/// Helper function to create query hashes for searching the database
pub fn generate_search_query(key: &[u8; 32], field: &str, value: &str) -> (String, String) {
    let field_hash = keyed_hash(key, field);
    let value_hash = keyed_hash(key, value);
    (field_hash, value_hash)
}
