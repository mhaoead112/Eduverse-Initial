import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // PDF preview
  if (type.includes("pdf") || fileUrl.endsWith(".pdf")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
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
  if (type.includes("image") || fileUrl.match(/\.(png|jpe?g|gif|webp)$/i)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Image Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full text-center">
            <img src={fileUrl} alt={fileName || "lesson-image"} className="mx-auto max-h-[640px] object-contain" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // PowerPoint / Office preview fallback
  if (type.includes("powerpoint") || fileUrl.match(/\.(pptx?|ppt)$/i)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presentation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">Preview for PowerPoint files isn't available in-browser. You can download the file to view it locally or open it with an online viewer.</p>
          <div className="flex gap-3">
            <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">Open / Download</a>
            <a href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + fileUrl)}`} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border rounded-md">Open in Office Online</a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generic fallback (download link)
  return (
    <Card>
      <CardHeader>
        <CardTitle>File</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">Couldn't preview this file type in the browser.</p>
        <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 text-blue-600 underline">Download / Open</a>
      </CardContent>
    </Card>
  );
};

export default LessonViewer;
