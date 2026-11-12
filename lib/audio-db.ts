export type StoredAudio = {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
};

const DB_NAME = "jec-connect-media";
const STORE_NAME = "audio";
const DB_VERSION = 1;

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    if(typeof indexedDB==="undefined"){reject(new Error("IndexedDB is not available in this browser."));return;}
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error??new Error("Unable to open local audio storage."));
  });
}

export async function saveAudioLocally(key:string,file:File):Promise<void>{
  const db=await openAudioDb();
  try {
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,"readwrite");
      tx.objectStore(STORE_NAME).put(
        {blob:file,name:file.name,type:file.type,lastModified:file.lastModified} satisfies StoredAudio,
        key
      );
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error??new Error("Unable to save the audio file."));
      tx.onabort=()=>reject(tx.error??new Error("Audio save was cancelled."));
    });
  } finally { db.close(); }
}

export async function getAudioLocally(key:string):Promise<File|null>{
  const db=await openAudioDb();
  try {
    return await new Promise<File|null>((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,"readonly");
      const request=tx.objectStore(STORE_NAME).get(key);
      request.onsuccess=()=>{
        const stored=request.result as StoredAudio|undefined;
        if(!stored?.blob){resolve(null);return;}
        resolve(new File([stored.blob],stored.name,{type:stored.type,lastModified:stored.lastModified}));
      };
      request.onerror=()=>reject(request.error??new Error("Unable to read the saved audio."));
    });
  } finally { db.close(); }
}

export async function removeAudioLocally(key:string):Promise<void>{
  const db=await openAudioDb();
  try {
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,"readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error??new Error("Unable to remove the saved audio."));
    });
  } finally { db.close(); }
}
