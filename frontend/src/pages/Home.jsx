import { Link } from "react-router-dom";
import dashboardImg from "../assets/dashboard.png";
function Home() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="bg-gradient-to-b from-[#2f1a6f] to-[#6f8df5] text-white">
      <div className="bg-white text-black flex justify-between items-center px-10 py-4 sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-indigo-700">SAFEDOCS</h1>
        <div className="space-x-6">
          <button onClick={() => scrollTo("hero")}>Home</button>
          <button onClick={() => scrollTo("services")}>Service</button>
          <button onClick={() => scrollTo("about")}>About</button>
          <button onClick={() => scrollTo("contact")}>Contact</button>
          <Link to="/login">Login</Link>
          <Link
            to="/register"
            className="bg-indigo-700 text-white px-4 py-2 rounded-full"
          >
            Register
          </Link>
        </div>
      </div>
      <section id="hero" className="text-center py-20 px-6">
        <span className="inline-block bg-indigo-700 px-6 py-2 rounded-full mb-6">
          Secured & Encrypted Storage
        </span>
        <h2 className="text-4xl font-bold mb-6">
          Your Digital Identity,<br /> Safe & Organized.
        </h2>
        <p className="max-w-2xl mx-auto mb-10 text-lg">
          Stop worrying about lost ID cards or damaged certificates.
          Store, encrypt, and access your important documents from anywhere, anytime.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/register"
            className="bg-white text-indigo-700 px-8 py-3 rounded-full font-semibold"
          >
            Get Started Now
          </Link>
          <button
            onClick={() => scrollTo("services")}
            className="border-2 border-white px-6 py-2 rounded-full"
          >
            Learn More
          </button>
        </div>
      </section>
      <div className="bg-indigo-700 rounded-3xl p-6 flex justify-center">
  <img
    src={dashboardImg}
    alt="Dashboard Preview"
    className="w-full max-w-5xl rounded-2xl shadow-lg"
  />
</div>
      <section id="services" className="bg-white text-black py-20 px-10">
        <h3 className="text-center text-indigo-700 font-semibold">
          OUR SERVICES
        </h3>
        <h2 className="text-center text-3xl font-bold mb-10">
          Why Choose SAFEDOCS?
        </h2>
        <p align="center"> We Provide a complete solution for digital identity management with top-tier security measures.<br></br><br></br></p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-100 p-6 rounded-xl">
            <h2 className="font-bold mb-2">Encrypted Storage</h2>
            <h4>
              Your documents are encrypted before they hit our servers.
              Only you have the key to access and decrypt your sensitive ID cards.
            </h4>
          </div>
          <div className="bg-gray-100 p-6 rounded-xl">
            <h2 className="font-bold mb-2">Smart Organization</h2>
            <h4>
              Categorize your documents into Academic, Personal, or Professional folders. Keep your digital life clutter-free and searchable
            </h4>
          </div>
          <div className="bg-gray-100 p-6 rounded-xl">
            <h2 className="font-bold mb-2">Access Anywhere</h2>
            <h4>
              Whether you are at college, work, or travelling, access your documents instantly from any device using a web browser.
            </h4>
          </div>
        </div>
      </section>
      <section id="about" className="bg-white text-black py-20 px-10">
        <h2 className="text-center text-3xl font-bold mb-6">
          About SAFE DOCS
        </h2>
        <p className="max-w-3xl mx-auto text-center">
          Managing multiple ID cards and physical documents is risky.
          SAFEDOCS was built as a secure, centralized, and lightweight platform
          to keep your digital identity safe.
        </p>
      </section>
      <footer
        id="contact"
        className="bg-[#0b0d2b] text-white py-16 px-10"
      >
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold mb-2">SAFE DOCS</h3>
            <p>
              Securely storing your academic and personal identity documents
              since 2025.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Quick Links</h3>
            <button
              onClick={() => scrollTo("hero")}
              className="block hover:underline"
            >
              HOME
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="block hover:underline"
            >
              ABOUT
            </button>
            <button
              onClick={() => scrollTo("services")}
              className="block hover:underline"
            >
              SERVICES
            </button>
            <Link
              to="/login"
              className="block hover:underline"
            >
              LOGIN
            </Link>
          </div>
          <div>
            <h3 className="font-bold mb-2">Contact</h3>
            <p>info@safedocs.com</p>
            <p>Farook College, Calicut</p>
          </div>
        </div>
        <p className="text-center mt-10 text-sm">
          © 2025 SAFE DOCS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
export default Home;