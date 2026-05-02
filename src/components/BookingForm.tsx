"use client";

import { useState } from "react";

import { buttonStyles } from "@/components/ui/button";

type Topic = "love" | "career" | "study" | "relationship" | "self" | "decision" | "other";
type ContactType = "wechat" | "phone" | "email";

const topicOptions: Array<{ value: Topic; label: string; tone: string }> = [
  { value: "love", label: "情感 · 爱情", tone: "圣杯水流" },
  { value: "relationship", label: "关系 · 人际", tone: "彼此映照" },
  { value: "career", label: "事业 · 工作", tone: "权杖之火" },
  { value: "study", label: "学业 · 考试", tone: "宝剑之锋" },
  { value: "decision", label: "选择 · 抉择", tone: "十字路口" },
  { value: "self", label: "自我 · 内在", tone: "向内的光" },
  { value: "other", label: "其他议题", tone: "随你描述" },
];

const contactTypeLabels: Record<ContactType, string> = {
  wechat: "微信号",
  phone: "电话",
  email: "邮箱",
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; createdAt: string }
  | { status: "error"; message: string };

export function BookingForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<ContactType>("wechat");
  const [topic, setTopic] = useState<Topic>("love");
  const [preferredTime, setPreferredTime] = useState("");
  const [timezone, setTimezone] = useState("北京时间");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;

    setState({ status: "submitting" });
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          contactType,
          topic,
          preferredTime: timezone === "北京时间" ? preferredTime : `${preferredTime} (${timezone})`,
          message,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "提交失败，请稍后再试");
      }
      setState({ status: "success", createdAt: json.createdAt });
      setMessage("");
      setPreferredTime("");
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "提交失败，请稍后再试",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div className="relative overflow-hidden py-8 sm:py-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(200,90,60,0.10)_0%,transparent_70%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 top-2 h-px w-24 bg-[linear-gradient(90deg,var(--coral-edge),transparent)]"
        />
        <p className="eyebrow mb-4">Reservation · 预约成功</p>
        <h3 className="font-serif-display text-[32px] leading-tight text-[var(--ink)]">
          预约已记下，<span className="text-[var(--coral)]">谢谢你的信任。</span>
        </h3>
        <p className="mt-6 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          我会在 24 小时内通过你留下的方式联系你，安排具体的占卜时间。<br className="hidden sm:block" />
          如果比较着急，也可以直接加微信 <span className="font-mono text-[var(--coral-deep)]">lmj123456lalala</span>，备注「预约占卜」。
        </p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className={buttonStyles({ variant: "secondary", className: "mt-8 px-5 py-2.5 text-[13.5px]" })}
        >
          再提交一份
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative pt-4 sm:pt-6"
    >
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <p className="eyebrow">Reservation Form · 预约表单</p>
          <h3 className="mt-1 font-serif-display text-[24px] leading-tight text-[var(--ink)]">
            你想聊点什么？
          </h3>
        </div>
        <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)] sm:inline">
          约 1 分钟填写
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-[0.85fr_1.15fr] items-start">
        <Field label="如何称呼你" required>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={40}
            placeholder="小名/昵称即可"
            className={inputClasses}
          />
        </Field>

        <Field label="怎么联系你" required>
          <div className="flex gap-2">
            <div className="relative w-[86px] flex-shrink-0">
              <select
                value={contactType}
                onChange={(event) => setContactType(event.target.value as ContactType)}
                className={`${inputClasses} w-full appearance-none pr-6 text-center`}
              >
                {(Object.keys(contactTypeLabels) as ContactType[]).map((value) => (
                  <option key={value} value={value}>
                    {contactTypeLabels[value]}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              required
              maxLength={80}
              placeholder={contactType === "wechat" ? "你的微信号" : contactType === "phone" ? "你的手机号" : "你的邮箱地址"}
              className={`${inputClasses} flex-1`}
            />
          </div>
        </Field>
      </div>

      <div className="mt-6">
        <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          想聊的方向 · Topic
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {topicOptions.map((option) => {
            const active = topic === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTopic(option.value)}
                className={`group relative overflow-hidden rounded-[10px] border px-3 py-2.5 text-left transition duration-200 ${
                  active
                    ? "border-[var(--coral)] bg-[var(--coral-wash)] shadow-[inset_0_0_0_1px_rgba(200,90,60,0.18)]"
                    : "border-[var(--line)] bg-transparent hover:-translate-y-[1px] hover:border-[var(--coral-edge)] hover:bg-[rgba(200,90,60,0.04)]"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute right-2 top-2 h-1.5 w-1.5 rotate-45 border transition ${
                    active
                      ? "border-[var(--coral)] bg-[var(--coral)]"
                      : "border-[var(--ink-faint)] bg-transparent group-hover:border-[var(--coral-edge)]"
                  }`}
                />
                <span className={`block text-[13.5px] font-medium ${active ? "text-[var(--coral-deep)]" : "text-[var(--ink)]"}`}>
                  {option.label}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {option.tone}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_0.8fr]">
        <Field label="期望的占卜时间">
          <input
            type="text"
            value={preferredTime}
            onChange={(event) => setPreferredTime(event.target.value)}
            maxLength={80}
            placeholder="例如：本周末晚上 / 明天下午"
            className={inputClasses}
          />
        </Field>

        <Field label="可选 · 你目前所在的时区">
          <div className="relative">
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className={`${inputClasses} appearance-none pr-8`}
            >
              <option value="北京时间">北京时间 (UTC+8)</option>
              <option value="美东时间">美东时间 (EST/EDT)</option>
              <option value="美西时间">美西时间 (PST/PDT)</option>
              <option value="欧洲中部时间">欧洲中部时间 (CET/CEST)</option>
              <option value="英国时间">英国时间 (GMT/BST)</option>
              <option value="澳洲东部时间">澳洲东部时间 (AEST/AEDT)</option>
              <option value="其他时区">其他时区</option>
            </select>
          </div>
        </Field>
      </div>

      <Field label="想提前告诉我的一些事" className="mt-8">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="比如最近总是失眠、或者刚好遇到人生的分岔路。你也可以什么都不写，等连线了再说。"
          className={`${inputClasses} resize-none leading-7`}
        />
        <p className="mt-1.5 text-right font-mono text-[10.5px] text-[var(--ink-muted)]">
          {message.length} / 500
        </p>
      </Field>

      {state.status === "error" ? (
        <p className="mt-4 rounded-[10px] border border-[var(--coral-edge)] bg-[var(--coral-wash)] px-3 py-2 text-[13px] text-[var(--coral-deep)]">
          {state.message}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse items-stretch gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[12.5px] leading-6 text-[var(--ink-muted)]">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--coral)] opacity-80" />
          提交后，我会收到你的预约信号。
        </p>
        <button
          type="submit"
          disabled={state.status === "submitting"}
          className={buttonStyles({ className: "px-6 py-3 text-[14.5px]" })}
        >
          {state.status === "submitting" ? "发送中…" : "发送预约 →"}
        </button>
      </div>
    </form>
  );
}

const inputClasses =
  "w-full rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] transition focus:border-[var(--coral)] focus:outline-none focus:ring-2 focus:ring-[var(--coral-edge)] disabled:opacity-60";

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
        {required ? <span className="ml-1 text-[var(--coral)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
