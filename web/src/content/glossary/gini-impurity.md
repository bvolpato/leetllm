---
title: Gini impurity
importance: 81
---

Gini impurity measures how mixed the class labels are inside a decision-tree node. A node containing one class has impurity zero. A node with evenly divided binary classes has impurity 0.5. Tree-building algorithms compare candidate splits by subtracting the weighted impurity of their children from the impurity of their parent.

## Formula and weighted decrease

For class proportions $p_1,\ldots,p_C$, $G=1-\sum_{c=1}^{C}p_c^2$. For binary data with positive proportion $p$, this becomes $G=1-p^2-(1-p)^2$. A split's decrease is $G_{parent}-(n_L/n)G_L-(n_R/n)G_R$. Child sizes must remain in the calculation; averaging child impurities without their sample counts can incorrectly favor a tiny pure leaf.

```mermaid
block-beta
 columns 8
 H["Parent: 4+, 4− · G = 0.50"]:8
 P1["+"] P2["+"] P3["+"] P4["+"] N1["−"] N2["−"] N3["−"] N4["−"]
 S["Split by ambiguity"]:8
 L["Left: 1+, 4−"]:5 R["Right: 3+"]:3
 LP["+"] LN1["−"] LN2["−"] LN3["−"] LN4["−"] RP1["+"] RP2["+"] RP3["+"]
 G1["G = 0.32"]:5 G2["G = 0"]:3
 T["Weighted G = 0.20 · ΔG = 0.30"]:8
 class P1,P2,P3,P4,LP,RP1,RP2,RP3 primary
 class N1,N2,N3,N4,LN1,LN2,LN3,LN4 secondary
 style H fill:transparent,stroke:transparent
 style S fill:transparent,stroke:transparent
 style G1 fill:transparent,stroke:transparent
 style G2 fill:transparent,stroke:transparent
 style T fill:transparent,stroke:transparent
```

## Example

Eight access requests include four positive review labels, giving root impurity $1-0.5^2-0.5^2=0.5$. A threshold sends one positive and four negatives left, giving $G_L=1-0.2^2-0.8^2=0.32$. Three positives go right, giving $G_R=0$. Weighted child impurity is $(5/8)(0.32)+(3/8)(0)=0.20$, so the Gini decrease is 0.30. The split improves purity but still misses one positive in the left leaf.

## Why it matters here

Calculating impurity by hand explains why a tree chooses one threshold over another. A split describes predictive association in the sample; causal importance, calibration, and held-out performance require separate evidence.

## Related terms

- [Decision tree](glossary://decision-tree)
- [Random forest](glossary://random-forest)
- [Decision threshold](glossary://decision-threshold)
