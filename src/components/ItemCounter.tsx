import React, { useEffect, useState } from "react";
import { History, Minus, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "./Avatar";
import AddItemModal from "./AddItemModal";
import RemoveItemModal from "./RemoveItemModal";
import type {
  AggregatedItem,
  ItemOption,
  ItemType,
  UserItem,
} from "../types/item-type.types";
import { RoomService } from "../services/room.service.ts";

interface ItemCounterProps {
  playerName: string;
  items: UserItem[];
  roomId: string;
  player: string;
  onItemsUpdate: (items: UserItem[]) => void;
  hideHistoryIcon?: boolean;
  playerPhotoURL?: string;
  itemType: ItemType;
}

const ItemCounter: React.FC<ItemCounterProps> = ({
  playerName,
  items,
  roomId,
  player,
  onItemsUpdate,
  hideHistoryIcon = false,
  playerPhotoURL,
  itemType,
}) => {
  const { user } = useAuth();

  // Check if user can modify items
  const canModifyItems = user?.uid === player;

  // Aggregate items by option, taking into account removed items
  const aggregateItems = (itemList: UserItem[]): AggregatedItem[] => {
    const aggregated: { [optionId: string]: AggregatedItem } = {};

    itemList.forEach((item) => {
      const option = itemType.options.find((opt) => opt.id === item.optionId);
      if (!option) return;

      if (!aggregated[item.optionId]) {
        aggregated[item.optionId] = {
          optionId: item.optionId,
          option,
          count: 0,
          totalPoints: 0,
        };
      }

      const count = item.count || 1;

      if (item.isRemoved) {
        // Subtract removed items from the total
        aggregated[item.optionId].count -= count;
        aggregated[item.optionId].totalPoints -= count * option.points;
      } else {
        // Add normal items to the total
        aggregated[item.optionId].count += count;
        aggregated[item.optionId].totalPoints += count * option.points;
      }
    });

    // Filter out items with zero or negative count
    return Object.values(aggregated).filter((agg) => agg.count > 0);
  };

  const [currentAggregated, setCurrentAggregated] = useState<AggregatedItem[]>(
    aggregateItems(items)
  );
  const [selectedOption, setSelectedOption] = useState<ItemOption | null>(
    itemType.options[0] || null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [optionToAdd, setOptionToAdd] = useState<ItemOption | null>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [optionToRemove, setOptionToRemove] = useState<ItemOption | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [playerHistory, setPlayerHistory] = useState<UserItem[]>([]);
  const [showRemovedInHistory, setShowRemovedInHistory] = useState(false);

  // Update aggregated data when items prop changes
  useEffect(() => {
    const newAggregated = aggregateItems(items);
    setCurrentAggregated(newAggregated);
  }, [items, itemType]);

  const openAddModal = (option: ItemOption) => {
    if (!canModifyItems) {
      console.warn("Tentative de modification non autorisée");
      return;
    }
    setOptionToAdd(option);
    setIsAddModalOpen(true);
  };

  const openRemoveModal = (option: ItemOption) => {
    if (!canModifyItems) {
      console.warn("Tentative de modification non autorisée");
      return;
    }
    setOptionToRemove(option);
    setIsRemoveModalOpen(true);
  };

  const openHistoryModal = async () => {
    try {
      const { UserRoomItemsService } = await import(
        "../services/userRoomItems.service"
      );
      const userRoomItems = await UserRoomItemsService.getUserRoomItems(
        player,
        roomId
      );
      setPlayerHistory(userRoomItems?.items || []);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error("Error loading player history:", error);
    }
  };
  const handleModalConfirm = async (count: number, comment: string) => {
    if (!optionToAdd || !roomId || !user) return;

    try {
      // Create the item directly
      const newItem: Omit<UserItem, "id"> = {
        optionId: optionToAdd.id,
        createdAt: new Date().toISOString(),
        count,
        ...(comment.trim() && { comment: comment.trim() }),
      };

      const { UserRoomItemsService } = await import(
        "../services/userRoomItems.service"
      );
      await UserRoomItemsService.addItem(user.uid, roomId, newItem);

      await RoomService.addActionToHistory(roomId, {
        type: "item_added",
        userId: user.uid,
        performedBy: user,
        details: `Ajouté ${count} ${optionToAdd.name} ${optionToAdd.emoji}${comment.trim() ? ` - ${comment.trim()}` : ""}`,
      });

      // Trigger reload
      onItemsUpdate([]);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleRemoveModalConfirm = async (count: number, comment: string) => {
    if (!optionToRemove || !roomId || !user) return;

    try {
      // Create the removal item directly
      const removalItem: Omit<UserItem, "id"> = {
        optionId: optionToRemove.id,
        createdAt: new Date().toISOString(),
        count,
        isRemoved: true,
        ...(comment.trim() && { comment: comment.trim() }),
      };

      const { UserRoomItemsService } = await import(
        "../services/userRoomItems.service"
      );
      await UserRoomItemsService.addItem(user.uid, roomId, removalItem);

      await RoomService.addActionToHistory(roomId, {
        type: "item_removed",
        userId: user.uid,
        performedBy: user,
        details: `Retiré ${count} ${optionToRemove.name} ${optionToRemove.emoji}${comment.trim() ? ` - ${comment.trim()}` : ""}`,
      });

      // Trigger reload
      onItemsUpdate([]);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Render items in a "mountain" style with emojis spread in a more natural mountain formation
  const renderItemMountain = (aggregated: AggregatedItem[]) => {
    if (aggregated.length === 0) {
      return (
        <p className="text-gray-500 text-sm sm:text-base lg:text-lg">
          Aucun item
        </p>
      );
    }

    // Create mountain-like rows with different widths for each item type
    const createMountainRows = (
      count: number,
      emoji: string,
      color?: string
    ) => {
      if (count === 0) return [];

      const rows = [];
      let remainingItems = count;
      let currentRow = 0;

      while (remainingItems > 0) {
        // Calculate items for this row - create a pyramid effect
        // First row gets most items, subsequent rows get fewer
        const maxItemsInRow = Math.max(
          1,
          Math.ceil(Math.sqrt(count)) - currentRow
        );
        const itemsInThisRow = Math.min(remainingItems, maxItemsInRow);

        rows.push({
          items: itemsInThisRow,
          emoji,
          color,
          rowIndex: currentRow,
        });

        remainingItems -= itemsInThisRow;
        currentRow++;
      }

      return rows.reverse(); // Put smaller rows on top
    };

    return (
      <div className="w-full h-full">
        <div className="flex flex-col items-center space-y-4 p-2">
          {aggregated.map((agg) => {
            const mountainRows = createMountainRows(
              agg.count,
              agg.option.emoji,
              agg.option.color
            );

            return (
              <div
                key={agg.optionId}
                className="flex flex-col items-center w-full"
              >
                <div className="text-xs sm:text-sm text-gray-600 mb-2 text-center">
                  {agg.option.name} ({agg.option.points} pts)
                </div>

                {/* Mountain formation - more compact for scrolling */}
                <div className="flex flex-col items-center space-y-1 max-w-full">
                  {mountainRows.map((row, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="flex justify-center items-end space-x-0.5 flex-wrap"
                      style={{
                        // Add slight offset to create more natural mountain look
                        transform: `translateX(${(rowIdx % 2) * 2 - 1}px)`,
                      }}
                    >
                      {Array.from({ length: row.items }, (_, i) => (
                        <div
                          key={`${rowIdx}-${i}`}
                          className="text-lg sm:text-xl lg:text-2xl transform hover:scale-110 transition-transform cursor-pointer flex-shrink-0"
                          style={{
                            color: row.color,
                            // Add slight random rotation for more natural look
                            transform: `rotate(${Math.sin(rowIdx + i) * 8}deg) scale(${0.9 + Math.sin(rowIdx + i) * 0.1})`,
                            // Slightly randomize positioning
                            marginLeft: `${Math.sin(rowIdx + i) * 1}px`,
                            zIndex: mountainRows.length - rowIdx, // Ensure top items are above bottom ones
                          }}
                        >
                          {row.emoji}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500 mt-2 text-center">
                  {agg.count} × {agg.option.points} = {agg.totalPoints} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getTotalPoints = (aggregated: AggregatedItem[]) => {
    return aggregated.reduce((sum, agg) => sum + agg.totalPoints, 0);
  };

  const getTotalItems = (aggregated: AggregatedItem[]) => {
    return aggregated.reduce((sum, agg) => sum + agg.count, 0);
  };

  return (
    <>
      <div className="flex flex-col items-center p-2 sm:p-4 lg:p-8">
        <div className="bg-gray-50 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-md sm:max-w-lg">
          {/* Header with player name and history button */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar
                photoURL={playerPhotoURL}
                displayName={playerName}
                size="md"
              />
              <div className="flex flex-col min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                  {playerName}
                </h2>
                <span className="text-xs text-gray-500">{itemType.name}</span>
                {canModifyItems && (
                  <span className="text-xs text-blue-600 font-medium">
                    Vos items
                  </span>
                )}
              </div>
            </div>
            {!hideHistoryIcon && (
              <button
                onClick={openHistoryModal}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-200 shadow-lg"
                title="Voir l'historique"
              >
                <History size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
          </div>

          {/* Displaying items in mountain style */}
          <div
            className="bg-white border-2 border-gray-200 rounded-lg
                p-3 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8
                h-32 sm:h-40 lg:h-56
                flex flex-col items-center justify-start
                overflow-y-auto overflow-x-hidden"
          >
            {renderItemMountain(currentAggregated)}
          </div>

          {/* Stats display */}
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <div className="flex justify-center space-x-6">
              <div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">
                  {getTotalItems(currentAggregated)}
                </span>
                <div className="text-xs sm:text-sm text-gray-500">Items</div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
                  {getTotalPoints(currentAggregated)}
                </span>
                <div className="text-xs sm:text-sm text-gray-500">Points</div>
              </div>
            </div>
          </div>

          {/* Option Selection */}
          {canModifyItems && (
            <div className="mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {itemType.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedOption?.id === option.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-lg sm:text-xl">{option.emoji}</div>
                    <div className="text-xs font-medium text-gray-700">
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.points} pts
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {canModifyItems && selectedOption && (
            <div className="flex justify-center space-x-2 sm:space-x-4">
              {/* REMOVE ITEM */}
              <button
                onClick={() => openRemoveModal(selectedOption)}
                disabled={
                  !currentAggregated.find(
                    (agg) => agg.optionId === selectedOption.id
                  )?.count
                }
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 shadow-lg"
                title={`Retirer ${selectedOption.name}`}
              >
                <Minus size={16} className="sm:w-5 sm:h-5" />
              </button>

              {/* ADD ITEM */}
              <button
                onClick={() => openAddModal(selectedOption)}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-lg"
                title={`Ajouter ${selectedOption.name}`}
              >
                <Plus size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {optionToAdd && (
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setOptionToAdd(null);
          }}
          onConfirm={handleModalConfirm}
          option={optionToAdd}
        />
      )}

      {/* Remove Item Modal */}
      {optionToRemove && (
        <RemoveItemModal
          isOpen={isRemoveModalOpen}
          onClose={() => {
            setIsRemoveModalOpen(false);
            setOptionToRemove(null);
          }}
          onConfirm={handleRemoveModalConfirm}
          option={optionToRemove}
          maxCount={
            currentAggregated.find((agg) => agg.optionId === optionToRemove.id)
              ?.count || 0
          }
        />
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Historique de {playerName}
                </h3>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-600">
                  Montrer les suppressions
                </span>
                <button
                  onClick={() => setShowRemovedInHistory(!showRemovedInHistory)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showRemovedInHistory ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showRemovedInHistory ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {playerHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun historique trouvé
                </p>
              ) : (
                <div className="space-y-3">
                  {playerHistory
                    .filter((item) => showRemovedInHistory || !item.isRemoved)
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((item, index) => {
                      const option = itemType.options.find(
                        (opt) => opt.id === item.optionId
                      );
                      if (!option) return null;

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            item.isRemoved
                              ? "border-red-200 bg-red-50"
                              : "border-green-200 bg-green-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{option.emoji}</span>
                              <div>
                                <span className="font-medium">
                                  {item.isRemoved ? "Retiré" : "Ajouté"}{" "}
                                  {item.count || 1} {option.name}
                                </span>
                                {item.comment && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    "{item.comment}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-sm ${
                                item.isRemoved
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {item.isRemoved ? "-" : "+"}
                              {(item.count || 1) * option.points} pts
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(item.createdAt).toLocaleString("fr-FR")}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemCounter;
