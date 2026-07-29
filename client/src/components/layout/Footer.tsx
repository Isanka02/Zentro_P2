const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 text-sm">
        <p className="text-white font-bold text-lg mb-2">Zentro</p>
        <p className="text-gray-400">© {new Date().getFullYear()} Zentro. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;