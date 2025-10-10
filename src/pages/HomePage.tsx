// noinspection SpellCheckingInspection

import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Camera,
  Crown,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  Save,
  User,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Room } from "../types/room.types";
import { formatShortDate, calculateUserTotals } from "../utils/helpers.ts";
import {
  addDoc,
  collection,
  documentId,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { UserService } from "../services/user.service.ts";
import { RoomService } from "../services/room.service.ts";
import { UserRoomItemsService } from "../services/userRoomItems.service";
import { ItemTypeService } from "../services/item-type.service";
import { ImageUploadService } from "../services/image-upload.service";
import Avatar from "../components/Avatar";
import Loading from "../components/Loading";
import SkeletonCard from "../components/SkeletonCard";
import type { AuthUser } from "../types/auth.types";

const HomePage = () => {
  const { user, signOut, updateProfile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomStats, setRoomStats] = useState<
    Record<
      string,
      {
        totalPoints: number;
        totalItems: number;
        players: {
          id: string;
          name: string;
          points: number;
          items: number;
          isLeader?: boolean;
        }[];
      }
    >
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  type TabType = "rooms" | "profile" | "developer-message";
  const [activeTab, setActiveTab] = useState<TabType>("rooms");

  // Profile states
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    photoURL: user?.photoURL || "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(
    user?.photoURL || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Developer message states
  const [developerMessage, setDeveloperMessage] = useState("");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);

  const navigate = useNavigate();

  // Mettre à jour formData quand user change
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        photoURL: user.photoURL || "",
      });
      setPreviewImage(user.photoURL || null);
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const previewUrl = await ImageUploadService.createPreviewURL(file);
      setPreviewImage(previewUrl);
      setSelectedFile(file);
    } catch (error) {
      console.error("Error creating preview:", error);
      alert("Erreur lors de la prévisualisation de l'image.");
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;

    setIsLoadingProfile(true);
    let newPhotoURL = formData.photoURL;

    try {
      if (selectedFile) {
        setIsUploadingImage(true);

        try {
          if (user.photoURL) {
            await ImageUploadService.deleteProfileImage(user.photoURL);
          }

          newPhotoURL = await ImageUploadService.uploadProfileImage(
            selectedFile,
            user.uid
          );
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          alert(
            "Erreur lors de l'upload de l'image. Sauvegarde des autres informations..."
          );
          newPhotoURL = user.photoURL || "";
        } finally {
          setIsUploadingImage(false);
        }
      }

      const updates: Partial<AuthUser> = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        photoURL: newPhotoURL,
      };

      await UserService.updateUserProfile(user.uid, updates);
      await updateProfile(updates);

      setSelectedFile(null);
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      alert("Erreur lors de la sauvegarde du profil.");
    } finally {
      setIsLoadingProfile(false);
      setIsUploadingImage(false);
    }
  };

  const handleDeveloperMessageSubmit = async () => {
    if (!user || !developerMessage.trim()) return;

    setIsSubmittingMessage(true);

    try {
      const messageData = {
        userId: user.uid,
        userDisplayName: user.displayName,
        userEmail: user.email,
        message: developerMessage.trim(),
        timestamp: serverTimestamp(),
        isRead: false,
      };

      await addDoc(collection(db, "developerMessages"), messageData);

      setDeveloperMessage("");
      setActiveTab("rooms");
      alert("Message envoyé avec succès ! Merci pour ton retour :)");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Erreur lors de l'envoi du message. Réessaie plus tard.");
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  useEffect(() => {
    const loadUserRooms = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get all rooms where user is the owner
        const ownedRoomsQuery = query(
          collection(db, "rooms"),
          where("owner.uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const ownedRoomsSnapshot = await getDocs(ownedRoomsQuery);
        const ownedRooms = ownedRoomsSnapshot.docs
          .map((doc) => RoomService.convertDocToRoom(doc, false))
          .filter((room) => room.owner?.uid); // Filter out invalid data

        // Get user data to fetch joined rooms
        const userData = await UserService.getUserById(user.uid);
        let joinedRooms: Room[] = [];

        if (userData?.joinedRooms && Object.keys(userData.joinedRooms).length > 0) {
          // Get rooms the user has joined (but doesn't own)
          const joinedRoomIds = Object.keys(userData.joinedRooms);
          const joinedRoomsQuery = query(
            collection(db, "rooms"),
            where(documentId(), "in", joinedRoomIds)
          );

          const joinedRoomsSnapshot = await getDocs(joinedRoomsQuery);
          joinedRooms = joinedRoomsSnapshot.docs
            .map((doc) => RoomService.convertDocToRoom(doc, false))
            .filter((room) => room.owner?.uid && room.owner.uid !== user.uid) // Exclude owned rooms and invalid data
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            ); // Sort manually
        }

        // Combine owned and joined rooms
        const allRooms = [...ownedRooms, ...joinedRooms];
        setRooms(allRooms);

        // Load statistics for each room
        const statsPromises = allRooms.map(async (room) => {
          try {
            const stats = await calculateRoomStats(room);
            return { [room.id!]: stats };
          } catch (error) {
            console.warn(`Error loading stats for room ${room.id}:`, error);
            return {
              [room.id!]: { players: [], totalPoints: 0, totalItems: 0 },
            };
          }
        });

        const statsResults = await Promise.all(statsPromises);
        const allStats = statsResults.reduce(
          (acc, curr) => ({ ...acc, ...curr }),
          {}
        );
        setRoomStats(allStats);
      } catch (error) {
        console.error("Error loading rooms:", error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    // noinspection JSIgnoredPromiseFromCall
    loadUserRooms();
  }, [user]);

  const handleRoomClick = (room: Room) => {
    if (room.id) {
      navigate(`/room/${room.id}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const calculateRoomStats = async (room: Room) => {
    try {
      // Get all user items for this room
      const allUserItems = await UserRoomItemsService.getAllRoomItems(room.id!);

      // Get room's item type to calculate points correctly
      let roomItemType = null;
      if (room.itemTypeId) {
        // First try to get from available types (generic + user's custom)
        const availableTypes = await ItemTypeService.getAvailableTypes(user?.uid);
        roomItemType = availableTypes.find(
          (type) => type.id === room.itemTypeId
        );
        
        // If not found, it might be a custom type from another user
        // Fetch it directly by ID
        if (!roomItemType) {
          roomItemType = await ItemTypeService.getTypeById(room.itemTypeId);
        }
      }

      // OPTIMIZED: Get all member data in a single query instead of N queries
      const memberIds = room.memberIds || [];
      const membersMap = await UserService.getUsersByIds(memberIds);

      // Calculate stats for each member
      const memberPlayers = memberIds.map((memberId) => {
        try {
          const memberData = membersMap.get(memberId);
          const userItems = allUserItems.find(
            (items) => items.userId === memberId
          );

          let totalPoints = 0;
          let totalItems = 0;

          if (userItems?.items && roomItemType) {
            const totals = calculateUserTotals(userItems.items, roomItemType);
            totalPoints = totals.totalPoints;
            totalItems = totals.totalItems;
          }

          return {
            id: memberId,
            name: memberData?.displayName || "Utilisateur inconnu",
            points: totalPoints,
            items: totalItems,
          };
        } catch (error) {
          console.warn(`Error loading member ${memberId}:`, error);
          return {
            id: memberId,
            name: "Utilisateur inconnu",
            points: 0,
            items: 0,
          };
        }
      });

      // Sort by points descending
      const sortedPlayers = memberPlayers.sort((a, b) => b.points - a.points);

      // Mark player(s) with the most points
      const maxPoints = sortedPlayers.length > 0 ? sortedPlayers[0].points : 0;
      const playersWithLeaderInfo = sortedPlayers.map((player) => ({
        ...player,
        isLeader: player.points === maxPoints && maxPoints > 0,
      }));

      // Calculate totals
      const totalPoints = memberPlayers.reduce(
        (sum, player) => sum + player.points,
        0
      );
      const totalItems = memberPlayers.reduce(
        (sum, player) => sum + player.items,
        0
      );

      return {
        players: playersWithLeaderInfo,
        totalPoints,
        totalItems,
      };
    } catch (error) {
      console.error("Error calculating room stats:", error);
      return {
        players: [],
        totalPoints: 0,
        totalItems: 0,
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Top row - User info and logout button */}
          <div className="flex justify-end items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Connecté en tant que</p>
                <p className="font-medium text-gray-800">{user?.displayName}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Main title - centered */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">
              GetSticked
            </h1>
            <p className="text-gray-600 text-sm sm:text-base px-4">
              Crée un salon pour n'importe quelle compétition entre 2 amis !
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 flex">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                activeTab === "rooms"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Home size={18} />
              <span>Mes Salons</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                (activeTab as string) === "profile"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <User size={18} />
              <span>Mon Profil</span>
            </button>
          </div>
        </div>

        {/* Action Buttons - Only show for rooms tab */}
        {activeTab === "rooms" && (
          <div className="flex flex-col items-center space-y-4 mb-8 px-4">
            <button
              onClick={() => navigate("/create")}
              className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transition-colors duration-200"
            >
              <Plus size={20} />
              <span>Créer un salon</span>
            </button>
            <button
              onClick={() => setActiveTab("developer-message" as TabType)}
              className="flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
            >
              <MessageSquare size={18} />
              <span>Message au développeur</span>
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "rooms" ? (
          /* StickRoom Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0">
            {loading ? (
              <SkeletonCard count={6} />
            ) : rooms.length === 0 ? (
              <div className="col-span-full text-center py-12 px-4">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                  Aucun salon trouvé
                </h3>
                <p className="text-gray-500 mb-6 text-sm sm:text-base">
                  Créez votre premier salon pour commencer à jouer
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => navigate("/create")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    Créer un salon
                  </button>
                </div>
              </div>
            ) : (
              rooms.map((room) => {
                const stats = roomStats[room.id!] || {
                  players: [],
                  totalPoints: 0,
                  totalItems: 0,
                };
                const isOwner = room.owner.uid === user?.uid;

                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                            {room.name}
                          </h3>
                          {!isOwner && (
                            <p className="text-sm text-green-600 font-medium">
                              Salon rejoint
                            </p>
                          )}
                        </div>
                        <div className="flex items-center ml-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                            {stats.totalPoints} points
                          </span>
                        </div>
                      </div>

                      {room.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {room.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        {stats.players
                          .slice(0, 4)
                          .map(
                            (player: {
                              id: string;
                              name: string;
                              points: number;
                              items: number;
                              isLeader?: boolean;
                            }) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center space-x-2">
                                  {player.isLeader && (
                                    <Crown
                                      size={14}
                                      className="text-yellow-500 flex-shrink-0"
                                    />
                                  )}
                                  <span className="text-gray-700 font-medium">
                                    {player.name}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    player.isLeader
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {player.points} points
                                </span>
                              </div>
                            )
                          )}
                        {stats.players.length > 4 && (
                          <div className="flex items-center justify-center text-sm text-gray-500 py-1">
                            <span>
                              ... et {stats.players.length - 4} autre
                              {stats.players.length - 4 > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>Créé le {formatShortDate(room.createdAt)}</span>
                        </div>
                        {room.updatedAt &&
                          formatShortDate(room.updatedAt) !==
                            "Date invalide" && (
                            <div className="flex items-center space-x-1">
                              <MessageSquare size={12} />
                              <span>MAJ {formatShortDate(room.updatedAt)}</span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : activeTab === "developer-message" ? (
          /* Developer Message Content */
          <div className="flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Message au développeur
                </h2>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg text-left">
                  <div className="text-blue-700">
                    <p className="font-medium mb-2">Salut !</p>
                    <p className="mb-2">
                      Étudiant à l'UTC et kiffeur du pic le jeudi. J'ai consacré
                      ces dernières semaines à travailler sur cette application
                      pendant mon temps libre
                    </p>
                    <p className="mb-2">
                      N'importe quel retour (bugs, erreurs, idées de features)
                      m'aiderait énormément pour améliorer l'application.
                    </p>
                    <p className="font-medium">
                      Merci d'avance pour ton aide !
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="developer-message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Ton message *
                  </label>
                  <textarea
                    id="developer-message"
                    value={developerMessage}
                    onChange={(e) => setDeveloperMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Décris ton bug, ton idée, ou partage ton ressenti sur l'app... :)"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setActiveTab("rooms")}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeveloperMessageSubmit}
                    disabled={!developerMessage.trim() || isSubmittingMessage}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                      !developerMessage.trim() || isSubmittingMessage
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    } text-white`}
                  >
                    {isSubmittingMessage ? (
                      <Loading size="sm" color="white" />
                    ) : (
                      <MessageSquare size={16} />
                    )}
                    {isSubmittingMessage
                      ? "Préparation..."
                      : "Envoyer le message"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Profile Content */
          <div className="flex justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
              {/* Photo de profil */}
              <div className="flex flex-col items-center mb-6">
                <div
                  onClick={() =>
                    !isUploadingImage && fileInputRef.current?.click()
                  }
                  className={`relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 transition-opacity group ${
                    isUploadingImage
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:opacity-75"
                  }`}
                >
                  <Avatar
                    photoURL={previewImage}
                    displayName={user?.displayName}
                    size="xl"
                    className="w-full h-full"
                  />
                  {isUploadingImage ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loading size="md" color="white" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={24} className="text-white" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {isUploadingImage
                    ? "Upload en cours..."
                    : "Cliquez pour changer la photo"}
                </p>
                {selectedFile && !isUploadingImage && (
                  <p className="text-xs text-blue-600 mt-1">
                    Nouvelle image sélectionnée: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Formulaire */}
              <div className="space-y-4">
                {/* Nom d'affichage */}
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom d'affichage *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom d'affichage"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Biographie
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Parlez-nous de vous... (optionnel)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/200 caractères
                  </p>
                </div>

                {/* Bouton Sauvegarder */}
                <button
                  onClick={handleProfileSave}
                  disabled={isLoadingProfile || isUploadingImage}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                    isLoadingProfile || isUploadingImage
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white`}
                >
                  {isLoadingProfile || isUploadingImage ? (
                    <Loading size="sm" color="white" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isUploadingImage
                    ? "Upload en cours..."
                    : isLoadingProfile
                      ? "Sauvegarde..."
                      : "Sauvegarder"}
                </button>

                {/* Informations du compte */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Informations du compte
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Email :</span> {user?.email}
                    </div>
                    <div>
                      <span className="font-medium">Membre depuis :</span>{" "}
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                        : "Non disponible"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
