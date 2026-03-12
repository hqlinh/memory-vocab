import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import AddVocab from "@/pages/AddVocab";
import EditVocab from "@/pages/EditVocab";
import VocabList from "@/pages/VocabList";
import FlashCard from "@/pages/FlashCard";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="add" element={<AddVocab />} />
          <Route path="edit/:id" element={<EditVocab />} />
          <Route path="list" element={<VocabList />} />
          <Route path="flash" element={<FlashCard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
