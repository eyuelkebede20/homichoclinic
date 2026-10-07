import Image from 'next/image';

export default function AdminProfilePage() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Logo</h1>
      <p className="mb-2">Current logo:</p>
      <Image src="/icon.png" alt="Current logo" width={120} height={120} className="border" />
      <form
        action="/api/upload-logo"
        method="POST"
        encType="multipart/form-data"
        className="mt-4 flex flex-col gap-2"
      >
        <input type="file" name="logo" accept="image/png" required />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload PNG Logo
        </button>
      </form>
    </div>
  );
}
