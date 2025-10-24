"use client";

export default function ChristmasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B0000] via-[#DC143C] to-[#228B22] flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Christmas Message with Santa Hat on M */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white mb-8 leading-tight">
            <span className="relative inline-block">
              <span className="relative">M</span>
              {/* Santa Hat on the M */}
              <img
                src="/images/santa-hat.png"
                alt="Santa Hat"
                className="absolute -top-16 md:-top-20 lg:-top-24 left-1/2 transform -translate-x-1/2 w-20 md:w-24 lg:w-32 h-auto rotate-12"
                style={{ zIndex: 10 }}
              />
            </span>
            erry Christmas
            <br />
            Mike
          </h1>

          {/* Decorative Snowflakes */}
          <div className="text-6xl md:text-7xl mb-8 animate-pulse">
            ❄️ ⛄ ❄️
          </div>
        </div>

        {/* Christmas Message */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 mb-8">
          <p className="text-2xl md:text-3xl text-[#2F4F33] font-serif italic mb-6 leading-relaxed">
            "May your holidays be filled with joy, peace, and the warmth of family and friends."
          </p>
          <p className="text-xl md:text-2xl text-[#7D6B58] font-serif">
            From all of us at Haven Ground
          </p>
        </div>

        {/* Festive Elements */}
        <div className="text-5xl md:text-6xl space-x-4">
          🎄 🎁 🔔 🕯️ ⭐
        </div>

        {/* Back to Home Link */}
        <div className="mt-12">
          <a
            href="/"
            className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-8 py-4 rounded-lg hover:bg-[#D2C6B2] transition-all duration-300 font-serif text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Back to Haven Ground
          </a>
        </div>

        {/* Falling Snow Animation */}
        <style jsx>{`
          @keyframes snowfall {
            0% {
              transform: translateY(-10vh) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) translateX(100px);
              opacity: 0;
            }
          }

          .snowflake {
            position: fixed;
            top: -10vh;
            color: white;
            font-size: 1.5rem;
            opacity: 0.8;
            animation: snowfall linear infinite;
            pointer-events: none;
          }

          .snowflake:nth-child(1) {
            left: 10%;
            animation-duration: 10s;
            animation-delay: 0s;
          }
          .snowflake:nth-child(2) {
            left: 20%;
            animation-duration: 12s;
            animation-delay: 1s;
          }
          .snowflake:nth-child(3) {
            left: 30%;
            animation-duration: 9s;
            animation-delay: 2s;
          }
          .snowflake:nth-child(4) {
            left: 40%;
            animation-duration: 11s;
            animation-delay: 0.5s;
          }
          .snowflake:nth-child(5) {
            left: 50%;
            animation-duration: 13s;
            animation-delay: 1.5s;
          }
          .snowflake:nth-child(6) {
            left: 60%;
            animation-duration: 10s;
            animation-delay: 2.5s;
          }
          .snowflake:nth-child(7) {
            left: 70%;
            animation-duration: 12s;
            animation-delay: 3s;
          }
          .snowflake:nth-child(8) {
            left: 80%;
            animation-duration: 9s;
            animation-delay: 1s;
          }
          .snowflake:nth-child(9) {
            left: 90%;
            animation-duration: 11s;
            animation-delay: 0s;
          }
        `}</style>

        {/* Snowflakes */}
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
      </div>
    </div>
  );
}
