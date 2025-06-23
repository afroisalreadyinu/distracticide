(require '[cljs.build.api :as b])

(b/watch "src"
  {:main 'firefox-clj.core
   :output-to "out/firefox_clj.js"
   :output-dir "out"})
