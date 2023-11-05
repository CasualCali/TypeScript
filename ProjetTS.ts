import axios from 'axios';
import * as fs from 'fs';
import * as mammoth from 'mammoth';

// Chemin d'accès des fichiers
const googleDriveFileUrl = 'https://drive.google.com/uc?export=download&id=1wYOUPKpnObyd3FPa-l6HnRxvUqIqdKZe';
//const googleDriveFileUrl = 'https://drive.google.com/uc?export=download&id=1qB8GLHCN38LtK3m_5vDCthlixBZFoxFK';

// Permet de lire le contenu d'un fichier depuis un Drive
async function readTextFileFromGoogleDrive(url: string): Promise<string | null> {
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Erreur lors de la récupération du fichier depuis Google Drive.');
            return null;
        }
    } catch (error) {
        console.error('Erreur de requête Google Drive :', error.message);
        return null;
    }
}

// Permet de lire et traiter un fichier Word
async function readWordFile(filePath: string): Promise<string | null> {
    try {
        const data: Buffer = await fs.promises.readFile(filePath);
        const result = await mammoth.extractRawText({ path: filePath });
        const text: string = result.value; // Texte brut extrait du fichier Word
        return text;
    } catch (err) {
        console.error('Erreur de lecture du fichier Word :', err);
        return null;
    }
}

// Permet d'ajouter des espaces dans divers cas 
function addSpaces(sentence: string): string {
    // Ajoute un espace après chaque virgule si ce n'est pas déjà le cas
    sentence = sentence.replace(/,/g, ', ');

    // Retire un espace après chaque virgule s'il y en a deux
    sentence = sentence.replace(/,  /g, ', ');

    // Ajoute un espace après une minuscule ou une majuscule si le caractère suivant est '...', '!', ou '?', si ce n'est pas déjà le cas
    sentence = sentence.replace(/([a-zA-Z])([…!?])(?![ ])/g, '$1 $2');

    // Ajoute un espace après une minuscule si elle est suivie d'un chiffre ou d'une majuscule
    sentence = sentence.replace(/([a-z])([0-9A-Z])/g, '$1 $2');

    // Ajoute un espace après un chiffre s'il est suivi d'une minuscule dotée d'un accent ou d'une majuscule
    sentence = sentence.replace(/([0-9])([a-zA-ZÀ-ÖØ-öø-ÿ])/g, '$1 $2');

    return sentence;
}

// Permet de séparer et afficher les phrases
function splitAndDisplayPhrases(text: string | null): void {
    if (text) {
        // Séparez les phrases après chaque '.', '!', '?', ou '...'
        const sentences: string[] = text.split(/(?<=[.!?…])/);

        // Affichez chaque phrase avec des espaces ajoutés
        sentences.forEach((sentence, index) => {
            // Ajoutez un espace aux phrases non vides avant de les afficher
            sentence = addSpaces(sentence);
            if (sentence.trim()) {
                console.log(`Phrase ${index + 1}: ${sentence.trim()}`);
            }
        });
    }
}

// Permet d'ajouter une majuscule au début de chaque phrase
function capitalizeSentences(text: string | null): string {
    const sentences: string[] = text.split(/(?<=[.!?…])/);

    const capitalizedSentences: string[] = sentences.map((sentence) => {
        // Vérifie si la première lettre de la phrase est une minuscule
        if (sentence.trim() && sentence[0] === sentence[0].toLowerCase()) {
            sentence = sentence[0].toUpperCase() + sentence.slice(1);
        }
        return sentence;
    });

    return capitalizedSentences.join('');
}

// Permet de lire et traiter le fichier
async function processFile(filePath: string, isLocal: boolean = true): Promise<void> {
    let text: string | null; // Nouvelle variable pour stocker le texte modifié

    if (isLocal) {
        // Si le fichier est local, on utilise readWordFile
        text = await readWordFile(filePath);
    } else {
        // Si le fichier est sur un Drive, on utilise readTextFileFromGoogleDrive
        text = await readTextFileFromGoogleDrive(filePath);
    }

    if (text) {
        // Permet d'ajouter des majuscules au début des phrases
        text = capitalizeSentences(text);
        splitAndDisplayPhrases(text);
    }
}

// Permet d'appeler la fonction pour lire et traiter le fichier depuis un Drive
processFile(googleDriveFileUrl, false);

