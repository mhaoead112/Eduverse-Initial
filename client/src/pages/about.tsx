import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Tag, Globe, Star } from "lucide-react";

export default function About() {
  return (
    <div className="pt-24 luxury-gradient min-h-screen">
      {/* About Header */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-4xl mx-auto border border-white/30">
              <h1 className="text-4xl font-luxury text-gray-900 mb-4">About EduVerse</h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto font-elegant">
                A pioneering educational institution dedicated to nurturing young minds and preparing them for a 
                globally connected world through innovative education and cultural diversity.
              </p>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            {/* Mission */}
            <Card className="luxury-card text-center border-0 shadow-2xl hover:scale-105 transition-all duration-400">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-luxury text-gray-800 mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed font-elegant">
                  To provide exceptional international education that develops critical thinkers, 
                  compassionate leaders, and global citizens ready to make a positive impact on the world.
                </p>
              </CardContent>
            </Card>
            
            {/* Vision */}
            <Card className="luxury-card text-center border-0 shadow-2xl hover:scale-105 transition-all duration-400">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Eye className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-luxury text-gray-800 mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed font-elegant">
                  To be a leading educational institution that inspires excellence, celebrates diversity, 
                  and creates a collaborative learning environment where every student thrives.
                </p>
              </CardContent>
            </Card>
            
            {/* Values */}
            <Card className="luxury-card text-center border-0 shadow-2xl hover:scale-105 transition-all duration-400">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-luxury text-gray-800 mb-4">Our Values</h3>
                <p className="text-gray-600 leading-relaxed font-elegant">
                  Excellence, Integrity, Respect, Innovation, and Global Citizenship guide everything we do, 
                  fostering an inclusive community of lifelong learners.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Accreditation & Diversity */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-luxury text-gray-900 mb-6">International Accreditation</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Tag className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-luxury text-gray-800 text-[18px]">International Baccalaureate (IB)</h4>
                    <p className="font-elegant text-[#ffffff]">World School authorization for PYP, MYP, and DP</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Globe className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-luxury text-gray-800 text-[18px]">Cambridge International</h4>
                    <p className="font-elegant text-[#ffffff]">IGCSE and A-Level program accreditation</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Star className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-luxury text-gray-800 text-[18px]">WASC Accredited</h4>
                    <p className="font-elegant text-[#f1f6fc]">Western Association of Schools and Colleges</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Diverse group of international students collaborating on project" 
                className="rounded-xl shadow-2xl w-full border-4 border-yellow-300/30 luxury-card" 
              />
            </div>
          </div>
        </div>
      </section>
      {/* Educational Philosophy */}
      <section className="py-20 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-luxury text-gray-900 mb-4">Our Educational Philosophy</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-elegant">
              We believe in developing the whole child through inquiry-based learning, 
              international-mindedness, and personal growth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="luxury-card text-center border-0 shadow-2xl hover:scale-105 transition-all duration-400">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="font-luxury text-gray-800 mb-2">Global Citizenship</h3>
                <p className="text-sm text-gray-600 font-elegant">
                  Developing awareness and understanding of global issues and interconnectedness.
                </p>
              </CardContent>
            </Card>
            
            <Card className="luxury-card text-center border-0 shadow-2xl hover:scale-105 transition-all duration-400">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-luxury text-gray-800 mb-2">Inquiry-Based Learning</h3>
                <p className="text-sm text-gray-600 font-elegant">
                  Encouraging curiosity and critical thinking through student-led investigations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="luxury-card text-center border-0 shadow-2xl hover:scale-105 transition-all duration-400">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="font-luxury text-gray-800 mb-2">Collaboration</h3>
                <p className="text-sm text-gray-600 font-elegant">
                  Building teamwork and communication skills through collaborative projects.
                </p>
              </CardContent>
            </Card>
            
            <Card className="luxury-card text-center border-0 shadow-2xl hover:scale-105 transition-all duration-400">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">💡</div>
                <h3 className="font-luxury text-gray-800 mb-2">Innovation</h3>
                <p className="text-sm text-gray-600 font-elegant">
                  Embracing creativity and new technologies to enhance learning experiences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
