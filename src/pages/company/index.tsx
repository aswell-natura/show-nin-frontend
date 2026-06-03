import { useState, type FormEvent } from "react";
import { Building2, Pencil, Save, X } from "lucide-react";
import { motion } from "motion/react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

interface CompanyInfo {
  companyName: string;
  phone: string;
  postalCode: string;
  address: string;
  businessNumber: string;
}

const initialCompanyInfo: CompanyInfo = {
  companyName: "株式会社SHOW-NIN",
  phone: "03-1234-5678",
  postalCode: "150-0002",
  address: "東京都渋谷区渋谷1-2-3 SHOW-NINビル8F",
  businessNumber: "T1234567890123",
};

const companyFields: Array<{
  key: keyof CompanyInfo;
  label: string;
  placeholder: string;
  autoComplete?: string;
}> = [
  {
    key: "companyName",
    label: "会社名",
    placeholder: "株式会社SHOW-NIN",
    autoComplete: "organization",
  },
  {
    key: "phone",
    label: "電話番号",
    placeholder: "03-1234-5678",
    autoComplete: "tel",
  },
  {
    key: "postalCode",
    label: "郵便番号",
    placeholder: "150-0002",
    autoComplete: "postal-code",
  },
  {
    key: "address",
    label: "住所",
    placeholder: "東京都渋谷区渋谷1-2-3",
    autoComplete: "street-address",
  },
  {
    key: "businessNumber",
    label: "事業者番号",
    placeholder: "T1234567890123",
  },
];

export default function CompanyPage() {
  const [companyInfo, setCompanyInfo] = useState(initialCompanyInfo);
  const [draftInfo, setDraftInfo] = useState(initialCompanyInfo);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    setDraftInfo(companyInfo);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftInfo(companyInfo);
    setIsEditing(false);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompanyInfo(draftInfo);
    setIsEditing(false);
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <form
          onSubmit={handleSave}
          className="flex h-full flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
            <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex w-full items-center gap-2 md:w-auto">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    自社情報
                  </h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  契約書や請求書に利用する会社情報を確認・変更できます。
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4" />
                      キャンセル
                    </Button>
                    <Button type="submit" variant="primary" className="gap-2">
                      <Save className="h-4 w-4" />
                      保存
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    className="gap-2"
                    onClick={startEditing}
                  >
                    <Pencil className="h-4 w-4" />
                    変更
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            <div className="mx-auto max-w-4xl">
              <motion.div
                layout
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-3 py-3 md:px-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground">
                      会社プロフィール
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      現在登録されている自社の基本情報です。
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {companyFields.map((field) => (
                    <motion.div
                      layout
                      key={field.key}
                      className="grid min-h-[60px] gap-1.5 px-3 py-3 md:grid-cols-[160px_1fr] md:items-center md:gap-3 md:px-4"
                    >
                      <label
                        htmlFor={`company-${field.key}`}
                        className="text-xs font-bold text-muted-foreground"
                      >
                        {field.label}
                      </label>
                      <div className="relative min-h-9">
                        <motion.input
                          id={`company-${field.key}`}
                          layout
                          value={draftInfo[field.key]}
                          onChange={(event) =>
                            setDraftInfo((current) => ({
                              ...current,
                              [field.key]: event.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                          readOnly={!isEditing}
                          tabIndex={isEditing ? 0 : -1}
                          animate={{
                            backgroundColor: isEditing
                              ? "var(--background)"
                              : "transparent",
                            borderColor: isEditing
                              ? "var(--input)"
                              : "transparent",
                            paddingLeft: isEditing ? 10 : 0,
                            paddingRight: isEditing ? 10 : 0,
                          }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="h-9 w-full rounded-lg border text-sm font-medium text-foreground outline-none transition-[box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/20 read-only:cursor-default"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
