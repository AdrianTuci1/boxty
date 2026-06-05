export default function ProfilePage() {
  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile</h1>
        <p className="text-gray-400 text-xs font-medium mt-1.5">Manage your account profile.</p>
      </div>

      {/* Account Data Configuration */}
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-5 space-y-5">
        {/* Avatar Upload */}
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 via-green-300 to-amber-300 text-xl font-bold text-white">
            A
          </div>
          <span className="text-gray-300 text-xs font-medium ml-4 tracking-wide hover:text-white transition-colors cursor-pointer">
            Upload Photo
          </span>
        </div>

        {/* Email */}
        <div>
          <label className="text-gray-400 text-xs font-medium block mb-2">Email</label>
          <div className="flex items-center justify-between border-t border-[#262626]/60 pt-3 w-full">
            <span className="text-gray-200 text-xs font-mono tracking-tight">adrian.tucicovenco@gmail.com</span>
            <button className="bg-[#161616] border border-[#2d2d2d] hover:bg-[#1f1f1f] text-white text-xs font-medium px-3 py-1.5 rounded-md transition-all">
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h2 className="text-sm font-semibold text-white mt-6 mb-3">Preferences</h2>
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-medium">Timezone</span>
              <svg className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
              <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Browser Local Time (3:35 AM · GMT+3)
              <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div>
        <h2 className="text-sm font-semibold text-white mt-8 mb-3">Connected Accounts</h2>
        <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#111111]/60 border-b border-[#262626] text-gray-500 text-[11px] font-semibold tracking-wider">
            <div className="flex px-4 py-3">
              <span className="flex-1 text-left">Provider</span>
              <span className="flex-1 text-left">Provider Username</span>
              <span className="flex-1 text-left">Connected</span>
            </div>
          </div>
          {/* Row */}
          <div className="px-4 py-3 border-b border-[#262626]/30 hover:bg-[#1f1f1f]/20 transition-colors flex items-center text-xs">
            <span className="flex-1 text-white font-sans font-medium">Google</span>
            <span className="flex-1 text-gray-300 font-mono">adrian.tucicovenco@gmail.com</span>
            <span className="flex-1 text-gray-500 font-mono">Mar 9, 2026</span>
          </div>
        </div>
      </div>
    </>
  )
}
