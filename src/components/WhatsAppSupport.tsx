import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "9647850572326";
const WHATSAPP_MESSAGE = encodeURIComponent("السلام عليكم، أحتاج مساعدة بخصوص نظام الكوثر للحسابات");

export default function WhatsAppSupport() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-28 lg:bottom-6 left-4 lg:left-6 z-50 flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      dir="rtl"
    >
      <span className="text-sm font-medium">الدعم</span>
      <MessageCircle className="w-5 h-5" />
    </a>
  );
}
