import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";

import { 
    getFirestore, collection, query, where, getDocs, doc, deleteDoc, addDoc, onSnapshot, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBO7HAWt2bUatuyV4VcOqrwXBSmZFYjKCQ",
    authDomain: "foldersync-6714b.firebaseapp.com",
    projectId: "foldersync-6714b",
    storageBucket: "foldersync-6714b.appspot.com",
    messagingSenderId: "902303440929",
    appId: "1:902303440929:web:840ca890dae53bc58f8360",
    measurementId: "G-C066FE3F6P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global variables
let currentParentId = 0;
let showDeleted = false;
let unsubscribeFolders = null;

// Load folders
function loadFolders(parentId = 0, isDeletedView = false) {
    if (unsubscribeFolders) unsubscribeFolders();

    const foldersElement = document.getElementById('folders');
    foldersElement.innerHTML = "";

    const foldersRef = collection(db, "folders");
    const q = query(
        foldersRef,
        where("parent_id", "==", parentId === 0 ? null : parentId),
        where("isDeleted", "==", isDeletedView)
    );

    unsubscribeFolders = onSnapshot(q, (querySnapshot) => {
        foldersElement.innerHTML = "";

        if (querySnapshot.empty) {
            foldersElement.innerHTML = "<p>No folders found.</p>";
            return;
        }

        querySnapshot.forEach(doc => {
            const folder = doc.data();
            const folderDiv = document.createElement("div");
            folderDiv.className = "folder-item";
            folderDiv.innerHTML = `
                <img src="https://images.vexels.com/media/users/3/276661/isolated/preview/614fa2f6000e812cb013b82d5ed0eb21-blue-folder-squared.png" class="folder-icon">
                <span class="folder-text">${folder.name}</span>
                <button class="delete-btn" data-id="${doc.id}">
                    <i class="fas fa-trash"></i> <!-- FontAwesome trash icon -->
                </button>
            `;
            folderDiv.addEventListener("click", () => openFolder(doc.id));
            folderDiv.querySelector(".delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFolderDeletion(doc.id, !isDeletedView);
            });

            foldersElement.appendChild(folderDiv);
        });
    }, (error) => {
        console.error("Error loading folders:", error);
    });
}

// Create a folder
async function createFolder() {
    const folderName = document.getElementById('folderName').value.trim();
    if (!folderName) {
        alert("Folder name cannot be empty.");
        return;
    }

    try {
        const folderRef = collection(db, "folders");
        await addDoc(folderRef, {
            name: folderName,
            parent_id: currentParentId === 0 ? null : currentParentId,
            isDeleted: false,
            created_at: serverTimestamp()
        });
        document.getElementById('folderName').value = "";
    } catch (error) {
        console.error("Error creating folder:", error);
    }
}

// Open a folder
function openFolder(folderId) {
    currentParentId = folderId;
    loadFolders(folderId, showDeleted);
}

// Toggle folder deletion state
async function toggleFolderDeletion(folderId, isDeleted) {
    const folderDocRef = doc(db, "folders", folderId);
    
    try {
        if (isDeleted) {
            // Mark the folder as deleted (or move to trash)
            await updateDoc(folderDocRef, { isDeleted: true });
            console.log("Folder moved to Trash.");
        } else {
            // Permanently delete the folder from Firestore
            await deleteDoc(folderDocRef);
            console.log("Folder permanently deleted.");
        }
    } catch (error) {
        console.error("Error updating folder deletion state:", error);
    }
}

// Toggle Trash/Home view
function toggleTrashView() {
    showDeleted = !showDeleted;
    document.getElementById('indicator').textContent = showDeleted ? "Deleted Folders" : "Home";
    const trashButton = document.getElementById('trashButton');
    trashButton.textContent = showDeleted ? "Home" : "Trash";
    loadFolders(currentParentId, showDeleted);
}

// Event listener setup
window.addEventListener("DOMContentLoaded", () => {
    loadFolders();

    const trashButton = document.getElementById('trashButton');
    if (trashButton) {
        trashButton.addEventListener("click", toggleTrashView);
    }

    const addFolderButton = document.querySelector(".add-folder .right");
    if (addFolderButton) {
        addFolderButton.addEventListener("click", createFolder);
    }
});
