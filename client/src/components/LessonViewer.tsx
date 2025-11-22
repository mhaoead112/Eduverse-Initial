import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

export const LessonViewer: React.FC<Props> = ({ fileUrl, fileType, fileName }) => {
  if (!fileUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No document available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">This lesson does not have an attached document.</p>
        </CardContent>
      </Card>
    );
  }

  const type = (fileType || fileName || "").toLowerCase();
  
  const DownloadButton = () => (
    <Button asChild variant="outline" className="gap-2">
      <a href={fileUrl} download={fileName} target="_blank" rel="noreferrer">
        <Download className="h-4 w-4" />
        Download
      </a>
    </Button>
  );

  // Video preview
  if (type.includes("video") || fileUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Video Lesson</CardTitle>
          <DownloadButton />
        </CardHeader>
        <CardContent>
          <div className="w-full bg-black rounded-md overflow-hidden">
            <video
              controls
              className="w-full max-h-[720px]"
              preload="metadata"
            >
              <source src={fileUrl} type={fileType || "video/mp4"} />
              Your browser does not support the video tag.
            </video>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PDF preview
  if (type.includes("pdf") || fileUrl.endsWith(".pdf")) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>PDF Document</CardTitle>
          <DownloadButton />
        </CardHeader>
        <CardContent>
          <div className="w-full h-[720px] bg-white border rounded-md overflow-hidden">
            <iframe
              title="lesson-pdf"
              src={fileUrl}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Image preview
  if (type.includes("image") || fileUrl.match(/\.(png|jpe?g|gif|webp|svg|bmp)$/i)) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Image</CardTitle>
          <DownloadButton />
        </CardHeader>
        <CardContent>
          <div className="w-full text-center bg-gray-50 p-4 rounded-lg">
            <img 
              src={fileUrl} 
              alt={fileName || "lesson-image"} 
              className="mx-auto max-h-[640px] object-contain rounded-lg shadow-md" 
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Word document preview using Google Docs Viewer
  if (type.includes("word") || type.includes("document") || fileUrl.match(/\.(docx?|doc)$/i)) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Word Document
          </CardTitle>
          <DownloadButton />
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <p className="text-sm text-gray-700 mb-2 font-semibold">{fileName || "Document.docx"}</p>
            <p className="text-xs text-gray-500 mb-6">Word documents need to be downloaded to view the full content.</p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <a href={fileUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  Download & Open
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PowerPoint / Office preview
  if (type.includes("powerpoint") || type.includes("presentation") || fileUrl.match(/\.(pptx?|ppt)$/i)) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Presentation</CardTitle>
          <DownloadButton />
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-16 w-16 text-orange-300 mx-auto mb-4" />
            <p className="text-sm text-gray-700 mb-2 font-semibold">{fileName || "Presentation.pptx"}</p>
            <p className="text-xs text-gray-500 mb-6">PowerPoint presentations need to be downloaded to view the full content.</p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <a href={fileUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  Download & Open
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Text file preview
  if (type.includes("text") || fileUrl.match(/\.(txt|md|csv)$/i)) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Text File</CardTitle>
          <DownloadButton />
        </CardHeader>
        <CardContent>
          <div className="w-full h-[720px] bg-white border rounded-md overflow-auto">
            <iframe
              title="text-file"
              src={fileUrl}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generic fallback (download link)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>File: {fileName || "Lesson Material"}</CardTitle>
        <DownloadButton />
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-700 mb-4">Preview not available for this file type.</p>
          <p className="text-xs text-gray-500 mb-4">Click the download button above to view this file.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonViewer;
