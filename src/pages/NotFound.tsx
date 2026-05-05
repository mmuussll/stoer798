export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50" dir="rtl">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">الصفحة غير موجودة</p>
        <a href="/" className="text-blue-600 hover:underline">العودة للرئيسية</a>
      </div>
    </div>
  );
}
