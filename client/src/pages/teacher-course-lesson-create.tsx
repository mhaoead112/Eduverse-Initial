import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Upload, FileText, Video, Link as LinkIcon, Loader2 } from "lucide-react";
import { apiEndpoint } from "@/lib/config";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function TeacherCourseLessonCreate() {
  const [, params] = useRoute("/teacher/courses/:courseId/lessons/create");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token, getAuthHeaders } = useAuth();
  
  const courseId = params?.courseId;
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a lesson title",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('courseId', courseId!);
      formData.append('lessonTitle', title);
      formData.append('content', content);
      formData.append('videoUrl', videoUrl);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(apiEndpoint('/api/lessons/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lesson created successfully",
        });
        setLocation(`/teacher/courses/${courseId}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create lesson");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lesson",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocation(`/teacher/courses/${courseId}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg border border-slate-700/50">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleCancel}
              className="hover:bg-slate-700/50 text-slate-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Lesson</h1>
              <p className="text-slate-400 mt-1">Add a new lesson to your course</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-slate-800/50 border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Lesson Details</CardTitle>
            <CardDescription className="text-slate-400">
              Fill in the information below to create a new lesson for this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Lesson Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter lesson title"
                  maxLength={255}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  {title.length}/255 characters
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-white">Lesson Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the lesson content, instructions, or description"
                  rows={8}
                  className="resize-none bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Provide detailed lesson content, learning objectives, or instructions
                </p>
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="flex items-center gap-2 text-white">
                  <Video className="h-4 w-4" />
                  Video URL (Optional)
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Add a YouTube, Vimeo, or other video URL for this lesson
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file" className="flex items-center gap-2 text-white">
                  <FileText className="h-4 w-4" />
                  Lesson File (Optional)
                </Label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-yellow-500 transition-colors bg-slate-700/30">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                    {file ? (
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-400">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PDF, DOC, DOCX, PPT, PPTX, TXT (max 50MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-900" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Lesson
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <FileText className="h-8 w-8 text-yellow-500 mb-3" />
              <h3 className="font-semibold mb-2 text-white">Lesson Content</h3>
              <p className="text-sm text-slate-400">
                Provide clear, detailed content that helps students understand the topic
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <Video className="h-8 w-8 text-yellow-500 mb-3" />
              <h3 className="font-semibold mb-2 text-white">Video Resources</h3>
              <p className="text-sm text-slate-400">
                Add video links to enhance learning with visual demonstrations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <Upload className="h-8 w-8 text-yellow-500 mb-3" />
              <h3 className="font-semibold mb-2 text-white">Supporting Files</h3>
              <p className="text-sm text-slate-400">
                Upload documents, presentations, or other materials for students
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
