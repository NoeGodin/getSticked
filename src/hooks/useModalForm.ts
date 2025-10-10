import { useState } from "react";

interface UseModalFormProps {
  onConfirm: (count: number, comment: string) => void;
  onClose: () => void;
}

export const useModalForm = ({ onConfirm, onClose }: UseModalFormProps) => {
  const [count, setCount] = useState(1);
  const [comment, setComment] = useState("");

  const handleConfirm = () => {
    onConfirm(count, comment);
    // Reset for next time
    setCount(1);
    setComment("");
    onClose();
  };

  const handleCancel = () => {
    setCount(1);
    setComment("");
    onClose();
  };

  return {
    count,
    setCount,
    comment,
    setComment,
    handleConfirm,
    handleCancel,
  };
};
