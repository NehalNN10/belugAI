export default function About() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-sky-50 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-sky-100 bg-white/80 p-6 text-sky-900 shadow-sm backdrop-blur">
        <p className="text-lg font-semibold">
          This project was made by Murtaza Naeem and Arham, students from grade 7C from The City School, PAF Chapter.
        </p>
        <p className="leading-relaxed">
          The purpose of this website is to give you a smart, patient study buddy. Whenever you get stuck on a tough
          homework problem, BelugAI is here to help you figure it out by giving you hints and guiding questions instead
          of just handing you the answers—so you actually learn how to do it yourself!
        </p>
      </div>
    </div>
  );
}
