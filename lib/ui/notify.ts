import { useToastStore } from "../../store/toast-store";

export function notifySuccess(title: string, message: string) {
  useToastStore.getState().showToast({ title, message, type: "success" });
}

export function notifyError(title: string, message: string) {
  useToastStore.getState().showToast({ title, message, type: "error" });
}

export function notifyInfo(title: string, message: string) {
  useToastStore.getState().showToast({ title, message, type: "info" });
}
