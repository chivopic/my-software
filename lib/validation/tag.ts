import { z } from "zod";

import { slugify } from "@/lib/utils/slug";

export const MAX_TAG_NAME_LENGTH = 30;
export const MAX_TAGS_PER_ENTITY = 10;

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "标签不能为空")
  .max(MAX_TAG_NAME_LENGTH, `标签不能超过 ${MAX_TAG_NAME_LENGTH} 个字符`)
  .refine((name) => slugify(name).length > 0, "标签至少要有一个字母、数字或汉字");

export const tagNamesSchema = z
  .array(tagNameSchema)
  .max(MAX_TAGS_PER_ENTITY, `一条最多 ${MAX_TAGS_PER_ENTITY} 个标签`)
  .transform((names) => {
    // 同一个 slug 只保留第一次出现的写法
    const seen = new Set<string>();
    return names.filter((name) => {
      const slug = slugify(name);
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
  });
