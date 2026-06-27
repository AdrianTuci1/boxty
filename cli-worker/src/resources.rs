use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::cmp::Ordering;
use std::path::{Component, Path, PathBuf};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SecretEnvVar {
    pub key: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SecretInfo {
    pub id: String,
    pub name: String,
    pub env_vars: Vec<SecretEnvVar>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VolumeInfo {
    pub id: String,
    pub name: String,
    pub size_gb: u32,
    pub volume_type: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DatabaseInfo {
    pub id: String,
    pub name: String,
    pub type_name: String,
    pub pk_name: String,
    pub sk_name: String,
    pub gsi_name: String,
    pub gsi_pk_name: String,
    pub gsi_sk_name: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VolumeEntry {
    pub name: String,
    pub path: String,
    pub entry_type: String,
    pub size: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DatabaseQuery {
    pub pk: Option<String>,
    pub sk: Option<String>,
    pub sk_begins_with: Option<String>,
    pub sk_from: Option<String>,
    pub sk_to: Option<String>,
    pub gsi_pk: Option<String>,
    pub gsi_sk: Option<String>,
    pub gsi_sk_begins_with: Option<String>,
    pub gsi_sk_from: Option<String>,
    pub gsi_sk_to: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DatabaseItem {
    pub item_id: String,
    pub pk: String,
    pub sk: String,
    pub value: Value,
}

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn make_id(prefix: &str) -> String {
    format!("{}_{}", prefix, rand::random::<u32>())
}

fn resource_file(name: &str) -> PathBuf {
    crate::state::ensure_state_dir().join(name)
}

fn secrets_path() -> PathBuf {
    resource_file("secrets.json")
}

fn volumes_path() -> PathBuf {
    resource_file("volumes.json")
}

fn databases_path() -> PathBuf {
    resource_file("databases.json")
}

fn volumes_root() -> PathBuf {
    let root = crate::state::ensure_state_dir().join("volumes");
    let _ = std::fs::create_dir_all(&root);
    root
}

fn databases_root() -> PathBuf {
    let root = crate::state::ensure_state_dir().join("databases");
    let _ = std::fs::create_dir_all(&root);
    root
}

fn database_items_path(db_id: &str) -> PathBuf {
    let dir = databases_root().join(db_id);
    let _ = std::fs::create_dir_all(&dir);
    dir.join("items.json")
}

fn volume_root_path(volume_id: &str) -> PathBuf {
    let dir = volumes_root().join(volume_id);
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn volume_data_path(volume_id: &str) -> PathBuf {
    let dir = volume_root_path(volume_id).join("data");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn read_secrets() -> Vec<SecretInfo> {
    crate::state::read_json(&secrets_path(), Vec::new())
}

fn write_secrets(secrets: &[SecretInfo]) {
    crate::state::write_json(&secrets_path(), &secrets);
}

fn read_volumes() -> Vec<VolumeInfo> {
    crate::state::read_json(&volumes_path(), Vec::new())
}

fn write_volumes(volumes: &[VolumeInfo]) {
    crate::state::write_json(&volumes_path(), &volumes);
}

fn read_databases() -> Vec<DatabaseInfo> {
    crate::state::read_json(&databases_path(), Vec::new())
}

fn write_databases(databases: &[DatabaseInfo]) {
    crate::state::write_json(&databases_path(), &databases);
}

fn read_database_values(db_id: &str) -> Vec<Value> {
    crate::state::read_json(&database_items_path(db_id), Vec::new())
}

fn write_database_values(db_id: &str, values: &[Value]) {
    crate::state::write_json(&database_items_path(db_id), &values);
}

fn normalize_relative_path(path: &str) -> Result<PathBuf, String> {
    let mut output = PathBuf::new();
    let trimmed = path.trim().trim_start_matches('/');

    if trimmed.is_empty() {
        return Ok(output);
    }

    for component in Path::new(trimmed).components() {
        match component {
            Component::Normal(part) => output.push(part),
            Component::CurDir => {}
            _ => return Err("invalid path".to_string()),
        }
    }

    Ok(output)
}

fn volume_by_id_or_name(locator: &str) -> Option<VolumeInfo> {
    read_volumes()
        .into_iter()
        .find(|volume| volume.id == locator || volume.name == locator)
}

fn database_by_id_or_name(locator: &str) -> Option<DatabaseInfo> {
    read_databases()
        .into_iter()
        .find(|database| database.id == locator || database.name == locator)
}

fn item_pk(info: &DatabaseInfo, value: &Value) -> Result<String, String> {
    let object = value
        .as_object()
        .ok_or_else(|| "database item must be a JSON object".to_string())?;
    let pk = object
        .get(&info.pk_name)
        .ok_or_else(|| format!("missing pk field '{}'", info.pk_name))?;
    scalar_string(pk).ok_or_else(|| format!("pk field '{}' must be scalar", info.pk_name))
}

fn item_sk(info: &DatabaseInfo, value: &Value) -> Result<String, String> {
    if info.sk_name.is_empty() {
        return Ok(String::new());
    }

    let object = value
        .as_object()
        .ok_or_else(|| "database item must be a JSON object".to_string())?;
    let sk = object
        .get(&info.sk_name)
        .ok_or_else(|| format!("missing sk field '{}'", info.sk_name))?;
    scalar_string(sk).ok_or_else(|| format!("sk field '{}' must be scalar", info.sk_name))
}

fn scalar_string(value: &Value) -> Option<String> {
    match value {
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.to_string()),
        Value::Bool(b) => Some(b.to_string()),
        _ => None,
    }
}

fn composite_item_id(pk: &str, sk: &str) -> String {
    if sk.is_empty() {
        pk.to_string()
    } else {
        format!("{}#{}", pk, sk)
    }
}

fn query_match(
    value: &Value,
    field_name: &str,
    exact: &Option<String>,
    begins_with: &Option<String>,
    from: &Option<String>,
    to: &Option<String>,
) -> bool {
    if field_name.is_empty() {
        return exact.is_none() && begins_with.is_none() && from.is_none() && to.is_none();
    }

    let actual = value
        .as_object()
        .and_then(|object| object.get(field_name))
        .and_then(scalar_string);

    let Some(actual) = actual else {
        return false;
    };

    if let Some(exact) = exact {
        if &actual != exact {
            return false;
        }
    }

    if let Some(prefix) = begins_with {
        if !actual.starts_with(prefix) {
            return false;
        }
    }

    if let Some(start) = from {
        if actual < *start {
            return false;
        }
    }

    if let Some(end) = to {
        if actual > *end {
            return false;
        }
    }

    true
}

fn sort_db_items(items: &mut [Value], info: &DatabaseInfo) {
    items.sort_by(|left, right| {
        let left_pk = item_pk(info, left).unwrap_or_default();
        let right_pk = item_pk(info, right).unwrap_or_default();

        match left_pk.cmp(&right_pk) {
            Ordering::Equal => {
                let left_sk = item_sk(info, left).unwrap_or_default();
                let right_sk = item_sk(info, right).unwrap_or_default();
                left_sk.cmp(&right_sk)
            }
            other => other,
        }
    });
}

pub fn list_secrets() -> Vec<SecretInfo> {
    read_secrets()
}

pub fn save_secret(name: &str, env_vars: Vec<SecretEnvVar>) -> Result<SecretInfo, String> {
    if name.trim().is_empty() {
        return Err("secret name is required".to_string());
    }

    if env_vars.is_empty() {
        return Err("secret must contain at least one env var".to_string());
    }

    let mut secrets = read_secrets();
    let timestamp = now();

    if let Some(existing) = secrets.iter_mut().find(|secret| secret.name == name) {
        existing.env_vars = env_vars;
        existing.updated_at = timestamp;
        let secret = existing.clone();
        write_secrets(&secrets);
        return Ok(secret);
    }

    let secret = SecretInfo {
        id: make_id("sec"),
        name: name.to_string(),
        env_vars,
        created_at: timestamp.clone(),
        updated_at: timestamp,
    };
    secrets.push(secret.clone());
    write_secrets(&secrets);
    Ok(secret)
}

pub fn delete_secret(name: &str) -> bool {
    let mut secrets = read_secrets();
    let original_len = secrets.len();
    secrets.retain(|secret| secret.name != name && secret.id != name);
    let changed = secrets.len() != original_len;
    if changed {
        write_secrets(&secrets);
    }
    changed
}

pub fn list_volumes() -> Vec<VolumeInfo> {
    read_volumes()
}

pub fn create_volume(name: &str, size_gb: u32, volume_type: &str) -> Result<VolumeInfo, String> {
    if name.trim().is_empty() {
        return Err("volume name is required".to_string());
    }

    if volume_type != "block-storage" && volume_type != "object-storage" {
        return Err("volume type must be block-storage or object-storage".to_string());
    }

    let mut volumes = read_volumes();
    if volumes.iter().any(|volume| volume.name == name) {
        return Err(format!("volume '{}' already exists", name));
    }

    let volume = VolumeInfo {
        id: make_id("vol"),
        name: name.to_string(),
        size_gb,
        volume_type: volume_type.to_string(),
        status: "mounted".to_string(),
        created_at: now(),
    };

    let _ = std::fs::create_dir_all(volume_data_path(&volume.id));
    volumes.push(volume.clone());
    write_volumes(&volumes);
    Ok(volume)
}

pub fn delete_volume(locator: &str) -> bool {
    let mut volumes = read_volumes();
    let Some(volume) = volume_by_id_or_name(locator) else {
        return false;
    };

    let original_len = volumes.len();
    volumes.retain(|entry| entry.id != volume.id);
    let changed = volumes.len() != original_len;

    if changed {
        write_volumes(&volumes);
        let _ = std::fs::remove_dir_all(volume_root_path(&volume.id));
    }

    changed
}

pub fn list_volume_entries(locator: &str, relative_path: &str) -> Result<Vec<VolumeEntry>, String> {
    let volume = volume_by_id_or_name(locator).ok_or_else(|| "volume not found".to_string())?;
    let safe_path = normalize_relative_path(relative_path)?;
    let dir = volume_data_path(&volume.id).join(&safe_path);

    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    let read_dir = std::fs::read_dir(&dir).map_err(|err| err.to_string())?;
    for entry in read_dir {
        let entry = entry.map_err(|err| err.to_string())?;
        let metadata = entry.metadata().map_err(|err| err.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let next_path = if safe_path.as_os_str().is_empty() {
            name.clone()
        } else {
            format!("{}/{}", safe_path.display(), name)
        };

        entries.push(VolumeEntry {
            name,
            path: next_path,
            entry_type: if metadata.is_dir() {
                "directory".to_string()
            } else {
                "file".to_string()
            },
            size: if metadata.is_file() {
                Some(metadata.len())
            } else {
                None
            },
        });
    }

    entries.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(entries)
}

pub fn write_volume_file(
    locator: &str,
    relative_path: &str,
    contents: &[u8],
) -> Result<VolumeEntry, String> {
    let volume = volume_by_id_or_name(locator).ok_or_else(|| "volume not found".to_string())?;
    let safe_path = normalize_relative_path(relative_path)?;
    if safe_path.as_os_str().is_empty() {
        return Err("file path is required".to_string());
    }

    let file_path = volume_data_path(&volume.id).join(&safe_path);
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    std::fs::write(&file_path, contents).map_err(|err| err.to_string())?;

    Ok(VolumeEntry {
        name: file_path
            .file_name()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_default(),
        path: safe_path.display().to_string(),
        entry_type: "file".to_string(),
        size: Some(contents.len() as u64),
    })
}

pub fn read_volume_file(locator: &str, relative_path: &str) -> Result<Vec<u8>, String> {
    let volume = volume_by_id_or_name(locator).ok_or_else(|| "volume not found".to_string())?;
    let safe_path = normalize_relative_path(relative_path)?;
    let file_path = volume_data_path(&volume.id).join(&safe_path);
    std::fs::read(file_path).map_err(|err| err.to_string())
}

pub fn delete_volume_entry(locator: &str, relative_path: &str) -> Result<bool, String> {
    let volume = volume_by_id_or_name(locator).ok_or_else(|| "volume not found".to_string())?;
    let safe_path = normalize_relative_path(relative_path)?;
    if safe_path.as_os_str().is_empty() {
        return Err("path is required".to_string());
    }

    let entry_path = volume_data_path(&volume.id).join(&safe_path);
    if !entry_path.exists() {
        return Ok(false);
    }

    if entry_path.is_dir() {
        std::fs::remove_dir_all(&entry_path).map_err(|err| err.to_string())?;
    } else {
        std::fs::remove_file(&entry_path).map_err(|err| err.to_string())?;
    }

    Ok(true)
}

pub fn list_databases() -> Vec<DatabaseInfo> {
    let mut databases = read_databases();
    for database in &mut databases {
        let items = read_database_values(&database.id);
        let item_count = items.len();
        if database.type_name.is_empty() {
            database.type_name = "EncryptedDatabase".to_string();
        }
        if database.sk_name == "null" {
            database.sk_name.clear();
        }
        if database.gsi_name == "null" {
            database.gsi_name.clear();
        }
        if item_count > 0 {
            let _ = item_count;
        }
    }
    databases
}

pub fn create_database(
    name: &str,
    pk_name: &str,
    sk_name: &str,
    gsi_name: &str,
    gsi_pk_name: &str,
    gsi_sk_name: &str,
) -> Result<DatabaseInfo, String> {
    if name.trim().is_empty() {
        return Err("database name is required".to_string());
    }

    if pk_name.trim().is_empty() {
        return Err("primary key name is required".to_string());
    }

    let mut databases = read_databases();
    if databases.iter().any(|database| database.name == name) {
        return Err(format!("database '{}' already exists", name));
    }

    let database = DatabaseInfo {
        id: make_id("db"),
        name: name.to_string(),
        type_name: "EncryptedDatabase".to_string(),
        pk_name: pk_name.to_string(),
        sk_name: sk_name.to_string(),
        gsi_name: gsi_name.to_string(),
        gsi_pk_name: gsi_pk_name.to_string(),
        gsi_sk_name: gsi_sk_name.to_string(),
        created_at: now(),
    };

    write_database_values(&database.id, &Vec::<Value>::new());
    databases.push(database.clone());
    write_databases(&databases);
    Ok(database)
}

pub fn delete_database(locator: &str) -> bool {
    let mut databases = read_databases();
    let Some(database) = database_by_id_or_name(locator) else {
        return false;
    };

    let original_len = databases.len();
    databases.retain(|entry| entry.id != database.id);
    let changed = databases.len() != original_len;
    if changed {
        write_databases(&databases);
        let _ = std::fs::remove_dir_all(databases_root().join(database.id));
    }
    changed
}

pub fn put_database_item(locator: &str, value: Value) -> Result<DatabaseItem, String> {
    let database =
        database_by_id_or_name(locator).ok_or_else(|| "database not found".to_string())?;
    let pk = item_pk(&database, &value)?;
    let sk = item_sk(&database, &value)?;
    let item_id = composite_item_id(&pk, &sk);

    let mut items = read_database_values(&database.id);
    items.retain(|existing| {
        let existing_pk = item_pk(&database, existing).unwrap_or_default();
        let existing_sk = item_sk(&database, existing).unwrap_or_default();
        existing_pk != pk || existing_sk != sk
    });
    items.push(value.clone());
    sort_db_items(&mut items, &database);
    write_database_values(&database.id, &items);

    Ok(DatabaseItem {
        item_id,
        pk,
        sk,
        value,
    })
}

pub fn delete_database_item(locator: &str, pk: &str, sk: &str) -> Result<bool, String> {
    let database =
        database_by_id_or_name(locator).ok_or_else(|| "database not found".to_string())?;
    let mut items = read_database_values(&database.id);
    let original_len = items.len();
    items.retain(|value| {
        let existing_pk = item_pk(&database, value).unwrap_or_default();
        let existing_sk = item_sk(&database, value).unwrap_or_default();
        existing_pk != pk || existing_sk != sk
    });
    let changed = items.len() != original_len;
    if changed {
        write_database_values(&database.id, &items);
    }
    Ok(changed)
}

pub fn list_database_items(locator: &str) -> Result<Vec<DatabaseItem>, String> {
    let database =
        database_by_id_or_name(locator).ok_or_else(|| "database not found".to_string())?;
    let mut items = read_database_values(&database.id);
    sort_db_items(&mut items, &database);
    Ok(items
        .into_iter()
        .map(|value| {
            let pk = item_pk(&database, &value).unwrap_or_default();
            let sk = item_sk(&database, &value).unwrap_or_default();
            DatabaseItem {
                item_id: composite_item_id(&pk, &sk),
                pk,
                sk,
                value,
            }
        })
        .collect())
}

pub fn query_database(locator: &str, query: DatabaseQuery) -> Result<Vec<DatabaseItem>, String> {
    let database =
        database_by_id_or_name(locator).ok_or_else(|| "database not found".to_string())?;
    let mut items = read_database_values(&database.id);
    sort_db_items(&mut items, &database);

    let target_field = if query.gsi_pk.is_some()
        || query.gsi_sk.is_some()
        || query.gsi_sk_begins_with.is_some()
        || query.gsi_sk_from.is_some()
        || query.gsi_sk_to.is_some()
    {
        if database.gsi_pk_name.is_empty() {
            return Err("database has no configured gsi".to_string());
        }
        (
            &database.gsi_pk_name,
            &database.gsi_sk_name,
            &query.gsi_pk,
            &query.gsi_sk,
            &query.gsi_sk_begins_with,
            &query.gsi_sk_from,
            &query.gsi_sk_to,
        )
    } else {
        (
            &database.pk_name,
            &database.sk_name,
            &query.pk,
            &query.sk,
            &query.sk_begins_with,
            &query.sk_from,
            &query.sk_to,
        )
    };

    let mut output = Vec::new();
    for value in items {
        if !query_match(&value, target_field.0, target_field.2, &None, &None, &None) {
            continue;
        }

        if !query_match(
            &value,
            target_field.1,
            target_field.3,
            target_field.4,
            target_field.5,
            target_field.6,
        ) {
            continue;
        }

        let pk = item_pk(&database, &value).unwrap_or_default();
        let sk = item_sk(&database, &value).unwrap_or_default();
        output.push(DatabaseItem {
            item_id: composite_item_id(&pk, &sk),
            pk,
            sk,
            value,
        });
    }

    if let Some(limit) = query.limit {
        output.truncate(limit);
    }

    Ok(output)
}

pub fn database_record_count(locator: &str) -> Result<usize, String> {
    let database =
        database_by_id_or_name(locator).ok_or_else(|| "database not found".to_string())?;
    Ok(read_database_values(&database.id).len())
}

pub fn encode_secret_env_vars(env_values: &[String]) -> Result<Vec<SecretEnvVar>, String> {
    let mut output = Vec::new();
    for raw in env_values {
        let Some((key, value)) = raw.split_once('=') else {
            return Err(format!("invalid env var '{}', expected KEY=VALUE", raw));
        };
        if key.trim().is_empty() {
            return Err("env var key cannot be empty".to_string());
        }
        output.push(SecretEnvVar {
            key: key.trim().to_string(),
            value: value.to_string(),
        });
    }
    Ok(output)
}

pub fn volume_public_url(port: u16, volume: &VolumeInfo, relative_path: &str) -> String {
    let normalized = relative_path.trim_start_matches('/');
    format!(
        "http://127.0.0.1:{}/objects/{}/{}",
        port, volume.name, normalized
    )
}

pub fn volume_locator_public_url(
    port: u16,
    locator: &str,
    relative_path: &str,
) -> Result<String, String> {
    let volume = volume_by_id_or_name(locator).ok_or_else(|| "volume not found".to_string())?;
    if volume.volume_type != "object-storage" {
        return Err("only object-storage volumes expose object URLs".to_string());
    }
    Ok(volume_public_url(port, &volume, relative_path))
}

#[allow(dead_code)]
pub fn volume_by_name(name: &str) -> Option<VolumeInfo> {
    read_volumes()
        .into_iter()
        .find(|volume| volume.name == name)
}

#[allow(dead_code)]
pub fn value_from_object(object: Map<String, Value>) -> Value {
    Value::Object(object)
}

pub fn guess_content_type(path: &str) -> &'static str {
    let extension = Path::new(path)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());

    match extension.as_deref() {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("pdf") => "application/pdf",
        Some("json") => "application/json",
        Some("txt") | Some("log") | Some("md") => "text/plain; charset=utf-8",
        Some("html") => "text/html; charset=utf-8",
        Some("css") => "text/css; charset=utf-8",
        Some("js") => "application/javascript",
        Some("mjs") => "application/javascript",
        Some("csv") => "text/csv; charset=utf-8",
        _ => "application/octet-stream",
    }
}

pub fn resolve_secret(locator: &str) -> Result<SecretInfo, String> {
    read_secrets()
        .into_iter()
        .find(|secret| secret.id == locator || secret.name == locator)
        .ok_or_else(|| format!("secret '{}' not found", locator))
}

pub fn resolve_volume(locator: &str) -> Result<VolumeInfo, String> {
    volume_by_id_or_name(locator).ok_or_else(|| format!("volume '{}' not found", locator))
}

pub fn resolve_secret_env_pairs(locators: &[String]) -> Result<Vec<(String, String)>, String> {
    let mut pairs = Vec::new();
    for locator in locators {
        let secret = resolve_secret(locator)?;
        for env_var in secret.env_vars {
            pairs.push((env_var.key, env_var.value));
        }
    }
    Ok(pairs)
}

pub fn volume_data_dir(locator: &str) -> Result<PathBuf, String> {
    let volume = resolve_volume(locator)?;
    Ok(volume_data_path(&volume.id))
}
