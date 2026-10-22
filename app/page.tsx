import Chat from "@/components/Chat";
import Mascot from "@/components/Mascot";

export default function Home() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3">
        <Mascot className="h-10 w-10" />
        <div>
          <h1 className="text-xl font-bold leading-tight text-sky-900">BelugAI</h1>
          <p className="text-sm text-sky-700">Your study buddy for Grades 7–12</p>
        </div>
      </header>
      <Chat />
    </div>
  );
}
