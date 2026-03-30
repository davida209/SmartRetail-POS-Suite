import CryptoJS from 'crypto-js';

const SECRET_KEY = "LLAVE_MAESTRA_2026"; 

export const CryptoService = {
  encrypt: (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  },
  decrypt: (ciphertext) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (e) {
      throw new Error("Fallo de integridad: Archivo corrupto o llave incorrecta");
    }
  }
};
