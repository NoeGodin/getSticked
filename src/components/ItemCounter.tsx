import React, { useEffect, useState } from "react";
import { Check, History, Minus, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "./Avatar";
import AddItemModal from "./AddItemModal";
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

  // Aggregate items by option
  const aggregateItems = (itemList: UserItem[]): AggregatedItem[] => {
    const aggregated: { [optionId: string]: AggregatedItem } = {};

    itemList.forEach((item) => {
      if (item.isRemoved) return; // Skip removed items

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
      aggregated[item.optionId].count += count;
      aggregated[item.optionId].totalPoints += count * option.points;
    });

    return Object.values(aggregated);
  };

  const [currentAggregated, setCurrentAggregated] = useState<AggregatedItem[]>(
    aggregateItems(items)
  );
  const [tempAggregated, setTempAggregated] = useState<AggregatedItem[]>(
    aggregateItems(items)
  );
  const [selectedOption, setSelectedOption] = useState<ItemOption | null>(
    itemType.options[0] || null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [optionToAdd, setOptionToAdd] = useState<ItemOption | null>(null);

  // Update aggregated data when items prop changes
  useEffect(() => {
    const newAggregated = aggregateItems(items);
    setCurrentAggregated(newAggregated);
    setTempAggregated(newAggregated);
  }, [items, itemType]);

  const openAddModal = (option: ItemOption) => {
    if (!canModifyItems) {
      console.warn("Tentative de modification non autorisée");
      return;
    }
    setOptionToAdd(option);
    setIsAddModalOpen(true);
  };

  const handleAddItem = (option: ItemOption, count: number = 1) => {
    setTempAggregated((prev) => {
      const existing = prev.find((agg) => agg.optionId === option.id);
      if (existing) {
        return prev.map((agg) =>
          agg.optionId === option.id
            ? {
                ...agg,
                count: agg.count + count,
                totalPoints: (agg.count + count) * option.points,
              }
            : agg
        );
      } else {
        return [
          ...prev,
          {
            optionId: option.id,
            option,
            count,
            totalPoints: count * option.points,
          },
        ];
      }
    });
  };

  const handleModalConfirm = (count: number, comment: string) => {
    if (!optionToAdd) return;

    // Add to temp aggregated
    handleAddItem(optionToAdd, count);

    // Store the comment for later use when validating
    setTempItems((prev) => [
      ...prev,
      {
        optionId: optionToAdd.id,
        count,
        ...(comment.trim() && { comment: comment.trim() }),
        pendingAdd: true,
      },
    ]);
  };

  // Add state for temp items with comments
  const [tempItems, setTempItems] = useState<
    Array<{
      optionId: string;
      count: number;
      comment?: string;
      pendingAdd?: boolean;
    }>
  >([]);

  const handleRemoveItem = (option: ItemOption, count: number = 1) => {
    if (!canModifyItems) {
      console.warn("Tentative de modification non autorisée");
      return;
    }

    setTempAggregated((prev) => {
      return prev
        .map((agg) => {
          if (agg.optionId === option.id) {
            const newCount = Math.max(0, agg.count - count);
            return {
              ...agg,
              count: newCount,
              totalPoints: newCount * option.points,
            };
          }
          return agg;
        })
        .filter((agg) => agg.count > 0);
    });
  };

  const hasChanges = () => {
    if (currentAggregated.length !== tempAggregated.length) return true;

    return (
      currentAggregated.some((current) => {
        const temp = tempAggregated.find(
          (t) => t.optionId === current.optionId
        );
        return !temp || temp.count !== current.count;
      }) ||
      tempAggregated.some((temp) => {
        const current = currentAggregated.find(
          (c) => c.optionId === temp.optionId
        );
        return !current;
      })
    );
  };

  const handleValidate = async () => {
    if (!hasChanges() || !canModifyItems) return;

    try {
      // Calculate differences and apply changes
      const changes: Array<{ option: ItemOption; diff: number }> = [];

      // Check for additions and modifications
      tempAggregated.forEach((temp) => {
        const current = currentAggregated.find(
          (c) => c.optionId === temp.optionId
        );
        const diff = temp.count - (current ? current.count : 0);
        if (diff !== 0) {
          changes.push({ option: temp.option, diff });
        }
      });

      // Check for removals
      currentAggregated.forEach((current) => {
        const temp = tempAggregated.find(
          (t) => t.optionId === current.optionId
        );
        if (!temp) {
          changes.push({ option: current.option, diff: -current.count });
        }
      });

      // Apply changes
      const { UserRoomItemsService } = await import(
        "../services/userRoomItems.service"
      );

      for (const change of changes) {
        if (change.diff > 0) {
          // Find corresponding temp items to get comments
          const tempItemsForOption = tempItems.filter(
            (item) => item.optionId === change.option.id && item.pendingAdd
          );

          if (tempItemsForOption.length > 0) {
            // Create individual items with their comments
            for (const tempItem of tempItemsForOption) {
              const newItem: Omit<UserItem, "id"> = {
                optionId: change.option.id,
                createdAt: new Date().toISOString(),
                count: tempItem.count,
                ...(tempItem.comment && { comment: tempItem.comment }),
              };

              if (roomId && user) {
                await UserRoomItemsService.addItem(user.uid, roomId, newItem);

                await RoomService.addActionToHistory(roomId, {
                  type: "item_added",
                  userId: user.uid,
                  performedBy: user,
                  details: `Ajouté ${tempItem.count} ${change.option.name} ${change.option.emoji}${tempItem.comment ? ` - ${tempItem.comment}` : ""}`,
                });
              }
            }
          } else {
            // Fallback for items without temp data
            const newItem: Omit<UserItem, "id"> = {
              optionId: change.option.id,
              createdAt: new Date().toISOString(),
              count: change.diff,
            };

            if (roomId && user) {
              await UserRoomItemsService.addItem(user.uid, roomId, newItem);

              await RoomService.addActionToHistory(roomId, {
                type: "item_added",
                userId: user.uid,
                performedBy: user,
                details: `Ajouté ${change.diff} ${change.option.name} ${change.option.emoji}`,
              });
            }
          }
        } else if (change.diff < 0) {
          // Remove items
          const removalItem: Omit<UserItem, "id"> = {
            optionId: change.option.id,
            createdAt: new Date().toISOString(),
            count: Math.abs(change.diff),
            isRemoved: true,
          };

          if (roomId && user) {
            await UserRoomItemsService.addItem(user.uid, roomId, removalItem);

            await RoomService.addActionToHistory(roomId, {
              type: "item_removed",
              userId: user.uid,
              performedBy: user,
              details: `Retiré ${Math.abs(change.diff)} ${change.option.name} ${change.option.emoji}`,
            });
          }
        }
      }

      // Update local state and trigger parent
      setCurrentAggregated([...tempAggregated]);

      // Clear temp items after successful validation
      setTempItems([]);

      // Trigger reload to update data
      onItemsUpdate([]);
    } catch (error) {
      console.error("Error updating items:", error);
      // Reset temp state on error
      setTempAggregated([...currentAggregated]);
      setTempItems([]);
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
      <div className="flex flex-col items-center space-y-6">
        {aggregated.map((agg) => {
          const mountainRows = createMountainRows(
            agg.count,
            agg.option.emoji,
            agg.option.color
          );

          return (
            <div key={agg.optionId} className="flex flex-col items-center">
              <div className="text-xs sm:text-sm text-gray-600 mb-2">
                {agg.option.name} ({agg.option.points} pts)
              </div>

              {/* Mountain formation */}
              <div className="flex flex-col items-center space-y-1">
                {mountainRows.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="flex justify-center items-end space-x-1"
                    style={{
                      // Add slight offset to create more natural mountain look
                      transform: `translateX(${(rowIdx % 2) * 2 - 1}px)`,
                    }}
                  >
                    {Array.from({ length: row.items }, (_, i) => (
                      <div
                        key={`${rowIdx}-${i}`}
                        className="text-xl sm:text-2xl lg:text-3xl transform hover:scale-110 transition-transform cursor-pointer"
                        style={{
                          color: row.color,
                          // Add slight random rotation for more natural look
                          transform: `rotate(${Math.sin(rowIdx + i) * 10}deg) scale(${0.9 + Math.sin(rowIdx + i) * 0.1})`,
                          // Slightly randomize positioning
                          marginLeft: `${Math.sin(rowIdx + i) * 2}px`,
                          zIndex: mountainRows.length - rowIdx, // Ensure top items are above bottom ones
                        }}
                      >
                        {row.emoji}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {agg.count} × {agg.option.points} = {agg.totalPoints} pts
              </div>
            </div>
          );
        })}
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
                onClick={() => {
                  /* TODO: Open item history */
                }}
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
                min-h-32 sm:min-h-40 lg:min-h-56
                flex items-center justify-center
                overflow-y-auto"
          >
            {renderItemMountain(tempAggregated)}
          </div>

          {/* Stats display */}
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <div className="flex justify-center space-x-6">
              <div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">
                  {getTotalItems(tempAggregated)}
                </span>
                <div className="text-xs sm:text-sm text-gray-500">Items</div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
                  {getTotalPoints(tempAggregated)}
                </span>
                <div className="text-xs sm:text-sm text-gray-500">Points</div>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-2 min-h-[1.25rem]">
              {hasChanges()
                ? `Sauvegardé: ${getTotalItems(currentAggregated)} items, ${getTotalPoints(currentAggregated)} pts`
                : ""}
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
                onClick={() => handleRemoveItem(selectedOption)}
                disabled={
                  !tempAggregated.find(
                    (agg) => agg.optionId === selectedOption.id
                  )?.count
                }
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 shadow-lg"
                title={`Retirer ${selectedOption.name}`}
              >
                <Minus size={16} className="sm:w-5 sm:h-5" />
              </button>

              {/* SAVE CHANGES */}
              <button
                onClick={handleValidate}
                disabled={!hasChanges()}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 shadow-lg"
                title="Sauvegarder les changements"
              >
                <Check size={16} className="sm:w-5 sm:h-5" />
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
    </>
  );
};

export default ItemCounter;
