import React from 'react';
import { MapPin, Phone, Mail, ChevronLeft } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#091526] text-blue-50 pt-16 pb-8 mt-auto border-t-4 border-blue-600">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Column 1: About */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
               <h3 className="text-2xl font-bold text-white tracking-wide border-b-2 border-yellow-500 pb-2">عن SAHER</h3>
            </div>
            <p className="text-sm text-blue-200/80 leading-7 max-w-sm">
              شركة رائدة في تقديم الحلول والأنظمة الذكية، ملتزمون بالابتكار والجودة لتحقيق أعلى مستويات الكفاءة والخدمات الذكية.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b-2 border-yellow-500 pb-2 inline-block pr-2 pl-6">
              روابط سريعة
            </h3>
            <ul className="space-y-3 text-sm">
              {['الرئيسية', 'خدماتنا', 'تواصل معنا'].map((item) => (
                <li key={item}>
                  <a href="#" className="flex items-center text-blue-100 hover:text-blue-400 transition-colors group w-fit">
                    <ChevronLeft size={16} className="ml-2 text-blue-500 group-hover:-translate-x-1 transition-transform" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b-2 border-yellow-500 pb-2 inline-block pr-2 pl-6">
              تواصل معنا
            </h3>
            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-4 group">
                <div className="bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-600 transition-colors border border-blue-800/30">
                  <MapPin className="text-blue-400 group-hover:text-white transition-colors" size={18} />
                </div>
                <span className="text-blue-200/80 pt-1">Level 3, Baynona Building, Khalif City A</span>
              </div>
              
              <div className="flex items-center gap-4 group">
                <div className="bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-600 transition-colors border border-blue-800/30">
                  <Phone className="text-blue-400 group-hover:text-white transition-colors" size={18} />
                </div>
                <span className="text-blue-200/80 font-mono text-base" dir="ltr">+971 4 123 4567</span>
              </div>
              
              <div className="flex items-center gap-4 group">
                <div className="bg-blue-900/30 p-2 rounded-full group-hover:bg-blue-600 transition-colors border border-blue-800/30">
                  <Mail className="text-blue-400 group-hover:text-white transition-colors" size={18} />
                </div>
                <a href="mailto:Logistic@saher.ae" className="text-blue-200/80 hover:text-white transition-colors font-sans">Logistic@saher.ae</a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar - Centered & Stacked */}
        <div className="border-t border-blue-900/50 pt-8 flex flex-col justify-center items-center gap-3 text-sm">
          
          <div className="flex items-center gap-2 text-blue-300 font-medium">
             <span>اعداد وتصميم /</span>
             <span className="text-white font-bold text-lg">خالد الجفري</span>
          </div>

          <div className="text-blue-400/60 text-center font-light dir-ltr">
            جميع الحقوق محفوظة لشركة &copy; {new Date().getFullYear()} SAHER FOR SMART SERVICES
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;