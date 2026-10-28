"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { Modal } from "@/components/Modal";
import { StudentPickerCard } from "./ExamPages";
import { DocHeader, ErrorBox, Loading, PrintButtons, useSchool } from "./shared";

type CertificateDoc = {
  title: string;
  body: string;
  foot: string;
  student: { name: string; admNo: string };
  school: { name: string; address: string; phone: string; header: string; footer: string };
};

export function CertificatePage() {
  const lookups = useLookups();
  const { school } = useSchool();
  const [docs, setDocs] = useState<CertificateDoc[] | null>(null);

  return (
    <>
      <StudentPickerCard
        title="Generate Certificate"
        description="Pick a template and the students who should receive it."
        templateLabel="Certificate template"
        templateOptions={lookups.list("templates")}
        actionLabel="Generate certificates"
        onGenerate={async ({ studentIds, templateId }) => {
          const results: CertificateDoc[] = [];
          for (const studentId of studentIds) {
            results.push(
              await apiPost<CertificateDoc>("/api/certificates", { templateId, studentId }),
            );
          }
          setDocs(results);
        }}
      />
      <Modal
        open={Boolean(docs)}
        title="Certificates"
        size="xl"
        onClose={() => setDocs(null)}
        footer={
          <PrintButtons>
            <button type="button" className="btn" onClick={() => setDocs(null)}>Close</button>
          </PrintButtons>
        }
      >
        {(docs ?? []).map((doc, index) => (
          <div className="doc cert" key={`${doc.student.admNo}-${index}`}>
            <DocHeader school={school} />
            <h2 style={{ fontSize: 22, margin: "10px 0 18px" }}>{doc.title.toUpperCase()}</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{doc.body}</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 34 }}>
              <span>Date: {new Date().toLocaleDateString("en-GB")}</span>
              <span>{doc.foot || "Principal"}</span>
            </div>
          </div>
        ))}
      </Modal>
    </>
  );
}

type CardTemplate = { color: string; validity: string };

export function IdCardPage() {
  const { school } = useSchool();
  const toast = useToast();
  const [template, setTemplate] = useState<CardTemplate | null>(null);
  const [color, setColor] = useState("#1d3a8a");
  const [validity, setValidity] = useState("");
  const [cards, setCards] = useState<
    | {
        id: string;
        name: string;
        admNo: string;
        rollNo: string | null;
        father?: string | null;
        phone?: string | null;
        photo?: string | null;
        className: string;
        sectionName: string;
      }[]
    | null
  >(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lookups = useLookups();

  useEffect(() => {
    apiGet<{ idCard: CardTemplate }>("/api/templates")
      .then((res) => {
        setTemplate(res.idCard);
        setColor(res.idCard.color || "#1d3a8a");
        setValidity(res.idCard.validity || "");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function saveDesign() {
    setBusy(true);
    setError("");
    try {
      await apiPatch("/api/templates", { type: "id", color, validity });
      setTemplate({ color, validity });
      toast("ID card design saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the design.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card">
        <div className="ct"><h3>ID Card Design</h3></div>
        <div className="flt">
          <label>
            Card colour
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </label>
          <label>
            Validity line
            <input
              value={validity}
              onChange={(event) => setValidity(event.target.value)}
              placeholder="Valid till March 2027"
            />
          </label>
          <button type="button" className="btn pri" onClick={saveDesign} disabled={busy}>
            {busy ? "Saving…" : "Save design"}
          </button>
        </div>
        <ErrorBox message={error} />
        {!template ? <Loading label="Loading design…" /> : null}
      </div>

      <StudentPickerCard
        title="Student ID Card"
        description="Select a class and the students whose cards you want to print."
        actionLabel="Generate ID cards"
        onGenerate={({ students }) => {
          setCards(
            students.map((student) => ({
              id: student.id,
              name: student.name,
              admNo: student.admNo,
              rollNo: student.rollNo,
              father: student.father,
              phone: student.phone,
              photo: student.photo,
              className: lookups.label("classes", student.classId),
              sectionName: lookups.label("sections", student.sectionId),
            })),
          );
        }}
      />

      <Modal
        open={Boolean(cards)}
        title="ID cards"
        size="xl"
        onClose={() => setCards(null)}
        footer={
          <PrintButtons>
            <button type="button" className="btn" onClick={() => setCards(null)}>Close</button>
          </PrintButtons>
        }
      >
        <div style={{ textAlign: "center" }}>
          {(cards ?? []).map((card) => (
            <div className="idc" key={card.id} style={{ borderColor: color }}>
              <div className="h" style={{ background: color }}>{school?.name ?? "ICE School"}</div>
              <div className="b">
                <div className="p">
                  {card.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={card.photo} />
                  ) : (
                    card.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <b>{card.name}</b>
                <br />
                {[card.className, card.sectionName].filter(Boolean).join(" ")}
                {card.rollNo ? ` · Roll ${card.rollNo}` : ""}
                <br />
                Adm No: {card.admNo}
                <br />
                Father: {card.father || "—"}
                <br />
                {card.phone || ""}
                <br />
                <small>{validity || template?.validity}</small>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
