import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { storage } from "../config/firebase";
import { withErrorHandler } from "../utils/service";

export class ImageUploadService {
  static async uploadProfileImage(file: File, userId: string): Promise<string> {
    return withErrorHandler(async () => {
      // Validate file
      this.validateImageFile(file);

      // Create reference to image
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const imageRef = ref(storage, `profile-images/${userId}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(imageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          originalName: file.name,
          uploadDate: new Date().toISOString(),
        },
      });

      return await getDownloadURL(snapshot.ref);
    }, "Error uploading profile image");
  }

  static async deleteProfileImage(imageUrl: string): Promise<void> {
    return withErrorHandler(async () => {
      if (!imageUrl || !imageUrl.includes("firebase")) {
        // Ignore if note firebase url
        return;
      }

      try {
        // extract path
        const url = new URL(imageUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);

        if (pathMatch) {
          const imagePath = decodeURIComponent(pathMatch[1]);
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
        }
      } catch (error) {
        // Si on ne peut pas supprimer l'ancienne image, on continue quand même
        console.warn("Could not delete old profile image:", error);
      }
    }, "Error deleting old profile image");
  }

  private static validateImageFile(file: File): void {
    // type MIME
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Type de fichier non supporté. Types acceptés: ${allowedTypes.join(", ")}`
      );
    }

    // allowed size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(
        `Fichier trop volumineux. Taille maximale: ${maxSize / (1024 * 1024)}MB`
      );
    }

    // Not empty file
    if (file.size === 0) {
      throw new Error("Le fichier est vide");
    }
  }

  static createPreviewURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };

      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du fichier"));
      };

      reader.readAsDataURL(file);
    });
  }
}
